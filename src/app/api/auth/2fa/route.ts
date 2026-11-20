import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import QRCode from "qrcode";
import { redis } from "@/lib/upstash";
import { verifyPassword } from "@/lib/auth";
import { isTrue } from "@/lib/password";
import { getSessionFromReq, rateLimit } from "@/lib/shop";
import {
  decryptSecret,
  encryptSecret,
  generateRecoveryCodes,
  generateTotpSecret,
  hashRecovery,
  otpauthUri,
  verifyTotp,
} from "@/lib/totp";
import { toStringArray } from "@/lib/two-factor";
import { audit } from "@/lib/audit";

const body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("setup") }),
  z.object({ action: z.literal("enable"), code: z.string().trim().min(6).max(8) }),
  z.object({ action: z.literal("disable"), password: z.string().min(1).max(200), code: z.string().trim().min(6).max(16) }),
]);

/** Estati 2FA pou itilizatè konekte a. */
export async function GET(req: NextRequest) {
  const session = await getSessionFromReq(req);
  if (!session) return NextResponse.json({ error: "Non otorize" }, { status: 401 });
  const u = await redis.hgetall<Record<string, unknown>>(`user:${session.email.toLowerCase()}`);
  return NextResponse.json({
    enabled: isTrue(u?.totpEnabled),
    recoveryLeft: toStringArray(u?.recoveryHashes).length,
  });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromReq(req);
  if (!session) return NextResponse.json({ error: "Non otorize" }, { status: 401 });
  if (!(await rateLimit(req, "2fa-manage", 20, 900))) {
    return NextResponse.json({ error: "Twòp eseye. Tann kèk minit." }, { status: 429 });
  }
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Demann pa valid." }, { status: 400 });

  const email = session.email.toLowerCase();
  const key = `user:${email}`;
  const user = await redis.hgetall<Record<string, unknown>>(key);
  if (!user || !user.id) return NextResponse.json({ error: "Kont pa jwenn." }, { status: 404 });
  const enabled = isTrue(user.totpEnabled);
  const d = parsed.data;

  if (d.action === "setup") {
    if (enabled) return NextResponse.json({ error: "2FA deja aktif." }, { status: 400 });
    const secret = generateTotpSecret();
    await redis.hset(key, { totpPendingEnc: encryptSecret(secret) });
    const uri = otpauthUri(email, secret);
    return NextResponse.json({ secret, qr: await QRCode.toDataURL(uri, { margin: 1, width: 220 }) });
  }

  if (d.action === "enable") {
    if (enabled) return NextResponse.json({ error: "2FA deja aktif." }, { status: 400 });
    const secret = decryptSecret(String(user.totpPendingEnc ?? ""));
    if (!secret) return NextResponse.json({ error: "Rekòmanse konfigirasyon an." }, { status: 400 });
    const counter = verifyTotp(secret, d.code);
    if (counter === null) return NextResponse.json({ error: "Kòd la pa kòrèk." }, { status: 400 });
    await redis.set(`totp:used:${email}:${counter}`, "1", { ex: 120 });

    const codes = generateRecoveryCodes(8);
    await redis.hset(key, {
      totpEnabled: true,
      totpSecretEnc: encryptSecret(secret),
      recoveryHashes: JSON.stringify(codes.map(hashRecovery)),
      totpEnabledAt: new Date().toISOString(),
    });
    await redis.hdel(key, "totpPendingEnc");
    await audit(req, { email, role: session.role }, { action: "auth.2fa_enabled", target: { type: "user", label: email } });
    // Kòd rekiperasyon yo parèt yon SÈL FWA isit la.
    return NextResponse.json({ ok: true, recoveryCodes: codes });
  }

  // disable: mande modpas la AK yon kòd (TOTP oswa rekiperasyon) — yon sesyon vòlè pa ase.
  if (!enabled) return NextResponse.json({ error: "2FA pa aktif." }, { status: 400 });
  if (!(await verifyPassword(d.password, String(user.passwordHash ?? "")))) {
    return NextResponse.json({ error: "Modpas la pa kòrèk." }, { status: 401 });
  }
  let ok = false;
  if (/^\d{6}$/.test(d.code.replace(/\s/g, ""))) {
    const secret = decryptSecret(String(user.totpSecretEnc ?? ""));
    const counter = secret ? verifyTotp(secret, d.code) : null;
    if (counter !== null && (await redis.set(`totp:used:${email}:${counter}`, "1", { nx: true, ex: 120 }))) ok = true;
  } else {
    ok = toStringArray(user.recoveryHashes).includes(hashRecovery(d.code));
  }
  if (!ok) return NextResponse.json({ error: "Kòd la pa kòrèk." }, { status: 401 });
  await redis.hdel(key, "totpEnabled", "totpSecretEnc", "totpPendingEnc", "recoveryHashes", "totpEnabledAt");
  await audit(req, { email, role: session.role }, { action: "auth.2fa_disabled", target: { type: "user", label: email } });
  return NextResponse.json({ ok: true });
}
