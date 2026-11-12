import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { redis } from "@/lib/upstash";
import { verifySession, verifyPassword, isSuperAdmin } from "@/lib/auth";

// Efase pwòp kont itilizatè a (egzije pa Apple App Store & Google Play).
// Mande modpas la pou konfime. Kont prensipal la pa ka efase isit la.
const schema = z.object({ password: z.string().min(1) });

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });

  if (isSuperAdmin(session.email)) {
    return NextResponse.json(
      { error: "Kont prensipal la pa ka efase depi app la." },
      { status: 403 }
    );
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Antre modpas ou pou konfime." }, { status: 400 });
  }

  const email = session.email.trim().toLowerCase();
  const user = await redis.hgetall<Record<string, string>>(`user:${email}`);
  if (!user?.passwordHash || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return NextResponse.json({ error: "Modpas pa kòrèk." }, { status: 401 });
  }

  await redis.del(`user:${email}`);
  await redis.srem("users:all", email);
  await redis.srem("users:disabled", email);

  const res = NextResponse.json({ ok: true });
  res.cookies.set("session", "", { httpOnly: true, secure: true, sameSite: "lax", maxAge: 0, path: "/" });
  return res;
}
