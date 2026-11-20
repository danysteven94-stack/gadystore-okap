import { SignJWT, jwtVerify } from "jose";
import { redis } from "@/lib/upstash"; // @upstash/redis = REST/fetch, konpatib Edge

// Modil sa a itilize sèlman `jose`, ki konpatib ak Edge Runtime — kontrèman
// ak bcryptjs, ki bezwen Node.js. `middleware.ts` DWE enpòte de la a, jamè
// de `auth.ts` (ki gen bcryptjs), otreman build la ka echwe oswa kraze sou
// Edge Runtime Vercel la.

// Sekrè a li LÈ YO BEZWEN L (pa pandan build la), pou build Vercel pa echwe.
// An pwodiksyon, si JWT_SECRET manke, login/sesyon refize mache (pa gen valè default danjere).
function getSecret(): Uint8Array {
  const v = process.env.JWT_SECRET;
  if (!v && process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET manke nan varyab anviwònman yo.");
  }
  return new TextEncoder().encode(v || "dev-only-secret");
}

// Kont prensipal la (pwopriyetè app la). Se SÈL kont ki ka wè TOUT lòt kont yo.
export const SUPER_ADMIN_EMAIL = (
  process.env.SUPER_ADMIN_EMAIL || "danystevenj@gmail.com"
).toLowerCase();

export function isSuperAdmin(email: string | undefined | null): boolean {
  return (email ?? "").trim().toLowerCase() === SUPER_ADMIN_EMAIL;
}

import type { UserRole } from "@/lib/permissions";
export type { UserRole };
export { permissions, can, pricesMatch } from "@/lib/permissions";

export interface SessionPayload {
  userId: string;
  email: string;
  role: UserRole;
  businessIds: string[];
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifySession(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    // Yon token "pwchange" pa ka janm sèvi kòm yon sesyon konplè.
    if (payload.purpose) return null;
    // Kont dezaktive: sesyon an invalid imedyatman (pa bezwen tann 7 jou JWT la fini).
    const email = String((payload as { email?: string }).email ?? "").toLowerCase();
    if (!email) return null;
    const [disabled, after] = await Promise.all([
      redis.sismember("users:disabled", email),
      redis.get<number | string>(`sess:after:${email}`),
    ]);
    if (disabled) return null;
    // Apre yon reyinisyalizasyon modpas, tout sesyon ki te kreye anvan an revoke.
    if (after && (payload.iat ?? 0) < Number(after)) return null;
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Token kout (15 min) bay APRE yon bon modpas tanporè, SÈLMAN pou chanje modpas la.
 * Pa gen sesyon konplè (cookie "session") anvan modpas la chanje.
 */
export async function signPwChangeToken(email: string): Promise<string> {
  return new SignJWT({ email, purpose: "pwchange" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(getSecret());
}

export async function verifyPwChangeToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.purpose !== "pwchange" || typeof payload.email !== "string") return null;
    return payload.email;
  } catch {
    return null;
  }
}

/** Token kout (5 min) bay APRE modpas la bon, SÈLMAN pou antre kòd 2FA a. Pa gen sesyon konplè anvan. */
export async function signMfaToken(email: string): Promise<string> {
  return new SignJWT({ email, purpose: "mfa" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(getSecret());
}

export async function verifyMfaToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.purpose !== "mfa" || typeof payload.email !== "string") return null;
    return payload.email;
  } catch {
    return null;
  }
}

/** Revoke tout sesyon ki egziste deja pou yon itilizatè (apre chanjman/reyinisyalizasyon modpas). */
export async function revokeSessions(email: string): Promise<void> {
  await redis.set(`sess:after:${email.toLowerCase()}`, Math.floor(Date.now() / 1000), { ex: 8 * 24 * 3600 });
}
