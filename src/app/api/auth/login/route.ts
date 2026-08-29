import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { redis } from "@/lib/upstash";
import { verifyPassword, signSession, type SessionPayload } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Antre yon imèl ak yon mo de pas valid." },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const user = await redis.hgetall<Record<string, string>>(`user:${email}`);

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "Imèl oswa mo de pas pa kòrèk." },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Imèl oswa mo de pas pa kòrèk." },
        { status: 401 }
      );
    }

    const session: SessionPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as SessionPayload["role"],
      businessIds: Array.isArray(user.businessIds)
        ? (user.businessIds as unknown as string[])
        : JSON.parse(user.businessIds || "[]"),
    };

    const token = await signSession(session);
    const res = NextResponse.json({ ok: true });
    res.cookies.set("session", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return res;
  } catch (err) {
    // TEMPORARY: montre mesaj erè a dirèkteman pou fasilite debogaj.
    // Retire detay sa a ("detail") yon fwa login fonksyone kòrèkteman.
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Erè sèvè.", detail: message },
      { status: 500 }
    );
  }
}
