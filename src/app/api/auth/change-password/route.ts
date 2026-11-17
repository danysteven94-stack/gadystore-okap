import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { redis } from "@/lib/upstash";
import {
  hashPassword,
  verifyPassword,
  signSession,
  verifyPwChangeToken,
  type SessionPayload,
} from "@/lib/auth";
import { isTrue } from "@/lib/password";
import { rateLimit } from "@/lib/shop";

const schema = z.object({
  newPassword: z
    .string()
    .min(8, "Modpas la dwe gen omwen 8 karaktè.")
    .max(72, "Modpas la two long.")
    .regex(/[A-Za-z]/, "Modpas la dwe gen omwen yon lèt.")
    .regex(/\d/, "Modpas la dwe gen omwen yon chif."),
});

export async function POST(req: NextRequest) {
  if (!(await rateLimit(req, "pwchange", 10, 900))) {
    return NextResponse.json({ error: "Twòp eseye. Tann kèk minit." }, { status: 429 });
  }

  const token = req.cookies.get("pwchange")?.value;
  const email = token ? await verifyPwChangeToken(token) : null;
  if (!email) {
    return NextResponse.json(
      { error: "Sesyon an ekspire. Konekte ankò ak modpas tanporè a.", expired: true },
      { status: 401 }
    );
  }

  if (await redis.sismember("users:disabled", email)) {
    return NextResponse.json({ error: "Kont sa a dezaktive. Kontakte administratè prensipal la.", expired: true }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Modpas pa valid." }, { status: 400 });
  }
  const { newPassword } = parsed.data;

  const user = await redis.hgetall<Record<string, unknown>>(`user:${email}`);
  if (!user || !user.passwordHash || !isTrue(user.mustChangePassword)) {
    return NextResponse.json({ error: "Pa gen okenn chanjman modpas ki oblije.", expired: true }, { status: 400 });
  }

  if (await verifyPassword(newPassword, String(user.passwordHash))) {
    return NextResponse.json({ error: "Chwazi yon modpas ki diferan de modpas tanporè a." }, { status: 400 });
  }
  if (newPassword.toLowerCase() === email) {
    return NextResponse.json({ error: "Modpas la pa ka menm ak imèl ou." }, { status: 400 });
  }

  const now = new Date().toISOString();
  await redis.hset(`user:${email}`, {
    passwordHash: await hashPassword(newPassword),
    mustChangePassword: false,
    passwordChangedAt: now,
    lastLoginAt: now,
  });

  const rawIds = user.businessIds as string | string[] | undefined;
  const session: SessionPayload = {
    userId: String(user.id),
    email: String(user.email),
    role: user.role as SessionPayload["role"],
    businessIds: Array.isArray(rawIds) ? rawIds : JSON.parse((rawIds as string) || "[]"),
  };

  const res = NextResponse.json({ ok: true });
  res.cookies.set("session", await signSession(session), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  res.cookies.set("pwchange", "", { httpOnly: true, secure: true, sameSite: "lax", maxAge: 0, path: "/api/auth" });
  return res;
}
