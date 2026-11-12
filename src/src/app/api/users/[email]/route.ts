import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/upstash";
import { verifySession, hashPassword, can } from "@/lib/auth";
import { generateTempPassword } from "@/lib/password";

// Sèl kont sa a gen dwa efase LÒT kont administratè yo. Modifye valè a
// (oswa mete varyab anviwònman SUPER_ADMIN_EMAIL sou Vercel) si w vle
// chanje kiyès ki gen dwa sa a.
const SUPER_ADMIN_EMAIL = (
  process.env.SUPER_ADMIN_EMAIL || "danystevenj@gmail.com"
).toLowerCase();

async function getSession(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  return token ? verifySession(token) : null;
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });

  if (session.email.toLowerCase() !== SUPER_ADMIN_EMAIL) {
    return NextResponse.json(
      { error: "Sèl kont prensipal la ka efase lòt administratè." },
      { status: 403 }
    );
  }

  const { email: rawEmail } = await params;
  const email = decodeURIComponent(rawEmail).trim().toLowerCase();

  if (email === SUPER_ADMIN_EMAIL) {
    return NextResponse.json(
      { error: "Ou pa ka efase kont prensipal la." },
      { status: 400 }
    );
  }

  const existing = await redis.hgetall<Record<string, unknown>>(`user:${email}`);
  if (!existing || !existing.id) {
    return NextResponse.json({ error: "Itilizatè pa jwenn." }, { status: 404 });
  }

  await redis.del(`user:${email}`);
  await redis.srem("users:all", email);
  await redis.srem("users:disabled", email);

  return NextResponse.json({ ok: true });
}

// PATCH { action: "reset_password" } — jenere yon nouvo modpas tanporè.
// Itilizatè a oblije chanje l nan pwochen koneksyon an.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });
  if (!can(session.role, "*")) {
    return NextResponse.json({ error: "Sèl Administrateur ka reyinisyalize modpas." }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const action = body.action as string;
  if (!["reset_password", "deactivate", "activate"].includes(action)) {
    return NextResponse.json({ error: "Aksyon envalid." }, { status: 400 });
  }

  const { email: rawEmail } = await params;
  const email = decodeURIComponent(rawEmail).trim().toLowerCase();
  const isSuperCaller = session.email.toLowerCase() === SUPER_ADMIN_EMAIL;

  // Dezaktive / reaktive: SÈL kont prensipal la gen dwa sa a.
  if (action === "deactivate" || action === "activate") {
    if (!isSuperCaller) {
      return NextResponse.json({ error: "Sèl kont prensipal la ka dezaktive oswa reaktive yon kont." }, { status: 403 });
    }
    if (email === SUPER_ADMIN_EMAIL) {
      return NextResponse.json({ error: "Ou pa ka dezaktive kont prensipal la." }, { status: 400 });
    }
    const user = await redis.hgetall<Record<string, unknown>>(`user:${email}`);
    if (!user || !user.id) {
      return NextResponse.json({ error: "Itilizatè pa jwenn." }, { status: 404 });
    }
    if (action === "deactivate") {
      await redis.sadd("users:disabled", email);
      await redis.hset(`user:${email}`, { disabled: true, disabledAt: new Date().toISOString() });
    } else {
      await redis.srem("users:disabled", email);
      await redis.hset(`user:${email}`, { disabled: false });
    }
    return NextResponse.json({ ok: true, disabled: action === "deactivate" });
  }

  if (email === SUPER_ADMIN_EMAIL) {
    return NextResponse.json({ error: "Kont prensipal la pa ka reyinisyalize isit la." }, { status: 403 });
  }

  const target = await redis.hgetall<Record<string, unknown>>(`user:${email}`);
  if (!target || !target.id) {
    return NextResponse.json({ error: "Itilizatè pa jwenn." }, { status: 404 });
  }
  if (target.role === "admin" && !isSuperCaller) {
    return NextResponse.json(
      { error: "Sèl kont prensipal la ka reyinisyalize modpas yon lòt administratè." },
      { status: 403 }
    );
  }

  const temporaryPassword = generateTempPassword();
  await redis.hset(`user:${email}`, {
    passwordHash: await hashPassword(temporaryPassword),
    mustChangePassword: true,
  });

  return NextResponse.json({ ok: true, temporaryPassword });
}
