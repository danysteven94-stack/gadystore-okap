import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createHash, randomBytes } from "crypto";
import { sendSecurityMail, mailConfigured } from "@/lib/mailer";
import { redis } from "@/lib/upstash";
import { rateLimit } from "@/lib/shop";

const schema = z.object({ email: z.string().trim().toLowerCase().email().max(200) });
const TTL = 30 * 60; // 30 minit

// Repons la ITILIZE MENM MESAJ kèlkeswa si imèl la egziste — pa gen fuit kont (user enumeration).
const GENERIC = { ok: true, message: "Si yon kont egziste ak imèl sa a, nou voye yon lyen pou chanje modpas la." };

export async function POST(req: NextRequest) {
  if (!(await rateLimit(req, "forgot", 5, 900))) {
    return NextResponse.json({ error: "Twòp eseye. Tann 15 minit." }, { status: 429 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Antre yon imèl valid." }, { status: 400 });
  const { email } = parsed.data;

  try {
    // 3 demann pa èdtan pa imèl (evite espam nan bwat imèl yon moun).
    const k = `rl:forgot-email:${email}`;
    const n = await redis.incr(k);
    if (n === 1) await redis.expire(k, 3600);
    if (n > 3) return NextResponse.json(GENERIC);

    const user = await redis.hgetall<Record<string, unknown>>(`user:${email}`);
    if (!user || !user.passwordHash || (await redis.sismember("users:disabled", email))) {
      return NextResponse.json(GENERIC);
    }

    const base = process.env.APP_URL;
    if (!mailConfigured() || !base) {
      console.error("forgot-password: GMAIL_USER/GMAIL_APP_PASSWORD (oswa RESEND_API_KEY) oswa APP_URL manke — pa kapab voye imèl la.");
      return NextResponse.json(GENERIC);
    }

    // Yon sèl lyen aktif pa itilizatè; se HASH la ki estoke, pa token an.
    const token = randomBytes(32).toString("base64url");
    const hash = createHash("sha256").update(token).digest("hex");
    const prev = await redis.get<string>(`pwreset-user:${email}`);
    if (prev) await redis.del(`pwreset:${prev}`);
    await redis.set(`pwreset:${hash}`, email, { ex: TTL });
    await redis.set(`pwreset-user:${email}`, hash, { ex: TTL });

    const link = `${base.replace(/\/$/, "")}/reset-password?token=${token}`;
    const text =
      `Bonjou,\n\nNou resevwa yon demann pou chanje modpas Platfomnou ou. Lyen an valab 30 minit:\n${link}\n\n` +
      `Si se pa ou ki fè demann lan, inyore imèl sa a — modpas ou pa chanje.\n\n` +
      `Vous avez demandé la réinitialisation de votre mot de passe Platfomnou. Lien valable 30 minutes :\n${link}\n` +
      `Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.`;
    await sendSecurityMail({
      to: email,
      subject: "Chanje modpas ou · Réinitialisation du mot de passe",
      text,
    });
  } catch (err) {
    console.error("forgot-password error", err);
  }
  return NextResponse.json(GENERIC);
}
