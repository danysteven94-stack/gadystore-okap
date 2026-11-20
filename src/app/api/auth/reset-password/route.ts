import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createHash } from "crypto";
import { redis } from "@/lib/upstash";
import { hashPassword, revokeSessions } from "@/lib/auth";
import { rateLimit } from "@/lib/shop";
import { audit } from "@/lib/audit";

const schema = z.object({
  token: z.string().min(20).max(100),
  newPassword: z
    .string()
    .min(8, "Modpas la dwe gen omwen 8 karaktè.")
    .max(72, "Modpas la two long.")
    .regex(/[A-Za-z]/, "Modpas la dwe gen omwen yon lèt.")
    .regex(/\d/, "Modpas la dwe gen omwen yon chif."),
});

export async function POST(req: NextRequest) {
  if (!(await rateLimit(req, "reset", 10, 900))) {
    return NextResponse.json({ error: "Twòp eseye. Tann kèk minit." }, { status: 429 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Demann pa valid." }, { status: 400 });
  }

  // Valide modpas la ANVAN, pou yon fôt frape pa boule lyen an. GETDEL = itilizasyon yon sèl fwa, atomik.
  const hash = createHash("sha256").update(parsed.data.token).digest("hex");
  const email = await redis.getdel<string>(`pwreset:${hash}`);
  if (!email) {
    return NextResponse.json({ error: "Lyen an pa valid oswa li ekspire. Mande yon lòt.", expired: true }, { status: 400 });
  }
  await redis.del(`pwreset-user:${email}`);

  const user = await redis.hgetall<Record<string, unknown>>(`user:${email}`);
  if (!user || !user.passwordHash || (await redis.sismember("users:disabled", email))) {
    return NextResponse.json({ error: "Lyen an pa valid.", expired: true }, { status: 400 });
  }
  if (parsed.data.newPassword.toLowerCase() === email) {
    // Lyen an deja itilize; itilizatè a dwe mande yon nouvo.
    return NextResponse.json({ error: "Modpas la pa ka menm ak imèl ou. Mande yon nouvo lyen.", expired: true }, { status: 400 });
  }

  await redis.hset(`user:${email}`, {
    passwordHash: await hashPassword(parsed.data.newPassword),
    mustChangePassword: false,
    passwordChangedAt: new Date().toISOString(),
  });
  await revokeSessions(email);
  await audit(req, { email, role: String(user.role ?? "") }, { action: "auth.password_reset", target: { type: "user", label: email }, meta: { via: "email_link" } });
  await redis.del(`rl:login-email:${email}`);
  // 2FA (si aktif) RETE aktif: reyinisyalizasyon modpas pa dezaktive dezyèm faktè a.
  return NextResponse.json({ ok: true });
}
