import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { redis } from "@/lib/upstash";
import { verifyPassword, signSession, signPwChangeToken, signMfaToken, type SessionPayload } from "@/lib/auth";
import { isTrue } from "@/lib/password";
import { rateLimit } from "@/lib/shop";
import { audit } from "@/lib/audit";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  try {
    // Pwoteksyon kont fòs brit: 20 eseye/15 min pa IP, 8 pa imèl
    if (!(await rateLimit(req, "login", 20, 900))) {
      return NextResponse.json({ error: "Twòp eseye. Tann 15 minit epi eseye ankò." }, { status: 429 });
    }
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Antre yon imèl ak yon mo de pas valid." },
        { status: 400 }
      );
    }

    const email = parsed.data.email.trim().toLowerCase();
    const { password } = parsed.data;
    const emailKey = `rl:login-email:${email}`;
    const attempts = await redis.incr(emailKey);
    if (attempts === 1) await redis.expire(emailKey, 900);
    if (attempts > 8) {
      return NextResponse.json({ error: "Twòp eseye pou kont sa a. Tann 15 minit." }, { status: 429 });
    }
    const user = await redis.hgetall<Record<string, string>>(`user:${email}`);

    if (!user || !user.passwordHash) {
      await audit(req, { email }, { action: "auth.login_failed", target: { type: "user", label: email }, meta: { reason: "unknown_user" } });
      return NextResponse.json(
        { error: "Imèl oswa mo de pas pa kòrèk." },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      await audit(req, { email }, { action: "auth.login_failed", target: { type: "user", label: email }, meta: { reason: "bad_password" } });
      return NextResponse.json(
        { error: "Imèl oswa mo de pas pa kòrèk." },
        { status: 401 }
      );
    }

    await redis.del(emailKey);
    if (await redis.sismember("users:disabled", email)) {
      await audit(req, { email }, { action: "auth.login_failed", target: { type: "user", label: email }, meta: { reason: "disabled" } });
      return NextResponse.json(
        { error: "Kont sa a dezaktive. Kontakte administratè prensipal la." },
        { status: 403 }
      );
    }

    // Premye koneksyon (modpas tanporè): PA bay sesyon konplè. Bay yon token kout
    // ki sèvi sèlman pou chanje modpas la.
    if (isTrue(user.mustChangePassword)) {
      const res = NextResponse.json({ ok: true, mustChangePassword: true });
      res.cookies.set("pwchange", await signPwChangeToken(email), {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: 60 * 15,
        path: "/api/auth",
      });
      return res;
    }

    // 2FA: modpas la bon, men sesyon an pa bay anvan kòd TOTP la verifye.
    if (isTrue(user.totpEnabled)) {
      const res = NextResponse.json({ ok: true, mfaRequired: true });
      res.cookies.set("mfa", await signMfaToken(email), {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: 60 * 5,
        path: "/api/auth",
      });
      return res;
    }

    const session: SessionPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as SessionPayload["role"],
      businessIds: Array.isArray(user.businessIds)
        ? (user.businessIds as unknown as string[])
        : JSON.parse(user.businessIds || "[]"),
    };

    // Backfill: si kont sa a te kreye anvan seksyon "Itilizatè" a, ajoute l
    // nan endèks la kounye a pou l parèt nan lis la.
    await redis.sadd("users:all", email);
    await redis.hset(`user:${email}`, { lastLoginAt: new Date().toISOString() });

    const token = await signSession(session);
    const res = NextResponse.json({ ok: true });
    res.cookies.set("session", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    await audit(req, { email, role: session.role }, { action: "auth.login", target: { type: "user", label: email } });
    return res;
  } catch (err) {
    console.error("login error", err);
    return NextResponse.json(
      { error: "Erè sèvè. Eseye ankò." },
      { status: 500 }
    );
  }
}
