import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { redis } from "@/lib/upstash";
import { parseBusinessIds, signSession, verifyMfaToken, type SessionPayload } from "@/lib/auth";
import { isTrue } from "@/lib/password";
import { rateLimit } from "@/lib/shop";
import { decryptSecret, hashRecovery, verifyTotp } from "@/lib/totp";
import { toStringArray } from "@/lib/two-factor";
import { audit } from "@/lib/audit";

const schema = z.object({ code: z.string().trim().min(6).max(16) });

/** Etap 2 login: verifye kòd TOTP (oswa yon kòd rekiperasyon) epi bay sesyon an. */
export async function POST(req: NextRequest) {
  if (!(await rateLimit(req, "mfa", 20, 900))) {
    return NextResponse.json({ error: "Twòp eseye. Tann 15 minit." }, { status: 429 });
  }
  const token = req.cookies.get("mfa")?.value;
  const email = token ? await verifyMfaToken(token) : null;
  if (!email) {
    return NextResponse.json({ error: "Sesyon an ekspire. Konekte ankò.", expired: true }, { status: 401 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Antre kòd la." }, { status: 400 });

  // 5 eseye pa 10 minit pa kont (kòd 6 chif yo fasil pou fòse si pa gen limit).
  const k = `rl:mfa-email:${email}`;
  const n = await redis.incr(k);
  if (n === 1) await redis.expire(k, 600);
  if (n > 5) return NextResponse.json({ error: "Twòp eseye pou kont sa a. Tann 10 minit." }, { status: 429 });

  const user = await redis.hgetall<Record<string, unknown>>(`user:${email}`);
  if (!user || !user.id || !isTrue(user.totpEnabled) || (await redis.sismember("users:disabled", email))) {
    return NextResponse.json({ error: "Kòd la pa kòrèk.", expired: true }, { status: 401 });
  }

  const code = parsed.data.code;
  let ok = false;
  if (/^\d{6}$/.test(code.replace(/\s/g, ""))) {
    const secret = decryptSecret(String(user.totpSecretEnc ?? ""));
    const counter = secret ? verifyTotp(secret, code) : null;
    // Anti-replay: yon kòd TOTP sèvi yon sèl fwa.
    if (counter !== null && (await redis.set(`totp:used:${email}:${counter}`, "1", { nx: true, ex: 120 }))) ok = true;
  } else {
    const hashes = toStringArray(user.recoveryHashes);
    const h = hashRecovery(code);
    if (hashes.includes(h)) {
      await redis.hset(`user:${email}`, { recoveryHashes: JSON.stringify(hashes.filter((x) => x !== h)) });
      ok = true;
    }
  }
  if (!ok) {
    await audit(req, { email }, { action: "auth.login_failed", target: { type: "user", label: email }, meta: { reason: "bad_2fa" } });
    return NextResponse.json({ error: "Kòd la pa kòrèk." }, { status: 401 });
  }

  await redis.del(k);
  const rawIds = user.businessIds as string | string[] | undefined;
  const session: SessionPayload = {
    userId: String(user.id),
    email: String(user.email),
    role: user.role as SessionPayload["role"],
    businessIds: parseBusinessIds(rawIds),
  };
  await redis.sadd("users:all", email);
  await redis.hset(`user:${email}`, { lastLoginAt: new Date().toISOString() });

  await audit(req, { email, role: String(session.role) }, { action: "auth.login", target: { type: "user", label: email }, meta: { mfa: true } });
  const res = NextResponse.json({ ok: true });
  res.cookies.set("session", await signSession(session), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  res.cookies.set("mfa", "", { httpOnly: true, secure: true, sameSite: "lax", maxAge: 0, path: "/api/auth" });
  return res;
}
