import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/upstash";
import { verifySession } from "@/lib/auth";

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

  return NextResponse.json({ ok: true });
}
