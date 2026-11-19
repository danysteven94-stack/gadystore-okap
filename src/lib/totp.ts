import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "crypto";

// TOTP (RFC 6238) san depandans ekstèn: HMAC-SHA1, 6 chif, 30 s — konpatib ak
// Google Authenticator, Microsoft Authenticator, Authy, 1Password, elatriye.

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(buf: Buffer): string {
  let bits = 0, value = 0, out = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(s: string): Buffer {
  let bits = 0, value = 0;
  const out: number[] = [];
  for (const ch of s.replace(/=+$/, "").toUpperCase()) {
    const idx = B32.indexOf(ch);
    if (idx < 0) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

function hotp(key: Buffer, counter: number): string {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const h = createHmac("sha1", key).update(msg).digest();
  const o = h[19] & 0xf;
  const code = (((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3]) % 1_000_000;
  return code.toString().padStart(6, "0");
}

/** Retounen konte (counter) ki matche a, oswa null. Tolerans ±1 etap (30 s) pou dekalaj revèy. */
export function verifyTotp(secretB32: string, token: string, now = Date.now()): number | null {
  const clean = token.replace(/\s/g, "");
  if (!/^\d{6}$/.test(clean)) return null;
  const key = base32Decode(secretB32);
  const step = Math.floor(now / 30000);
  for (const c of [step, step - 1, step + 1]) {
    const expected = Buffer.from(hotp(key, c));
    const given = Buffer.from(clean);
    if (expected.length === given.length && timingSafeEqual(expected, given)) return c;
  }
  return null;
}

export function otpauthUri(email: string, secretB32: string, issuer = "Platfomnou"): string {
  const label = encodeURIComponent(`${issuer}:${email}`);
  return `otpauth://totp/${label}?secret=${secretB32}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

// --- Chifreman sekrè a nan repo a (AES-256-GCM) ---------------------------------
// Opsyonèl: TOTP_ENCRYPTION_KEY. Si li pa defini, nou itilize JWT_SECRET (si w chanje
// JWT_SECRET, 2FA a dwe reaktive — pou sa mete yon TOTP_ENCRYPTION_KEY separe).
function encKey(): Buffer {
  const raw = process.env.TOTP_ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (!raw && process.env.NODE_ENV === "production") throw new Error("TOTP_ENCRYPTION_KEY oswa JWT_SECRET manke.");
  return createHash("sha256").update(`totp:${raw || "dev-only-secret"}`).digest();
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", encKey(), iv);
  const ct = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return ["v1", iv.toString("base64url"), c.getAuthTag().toString("base64url"), ct.toString("base64url")].join(".");
}

export function decryptSecret(stored: string): string | null {
  try {
    const [v, iv, tag, ct] = stored.split(".");
    if (v !== "v1") return null;
    const d = createDecipheriv("aes-256-gcm", encKey(), Buffer.from(iv, "base64url"));
    d.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([d.update(Buffer.from(ct, "base64url")), d.final()]).toString("utf8");
  } catch {
    return null;
  }
}

// --- Kòd rekiperasyon ----------------------------------------------------------------
const RC = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function generateRecoveryCodes(n = 8): string[] {
  return Array.from({ length: n }, () => {
    let s = "";
    for (let i = 0; i < 10; i++) s += RC[randomInt(RC.length)];
    return `${s.slice(0, 5)}-${s.slice(5)}`;
  });
}
export function hashRecovery(code: string): string {
  return createHash("sha256").update(code.replace(/[\s-]/g, "").toUpperCase()).digest("hex");
}
