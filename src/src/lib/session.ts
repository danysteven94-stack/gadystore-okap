import { SignJWT, jwtVerify } from "jose";
import { redis } from "@/lib/upstash"; // @upstash/redis = REST/fetch, konpatib Edge

// Modil sa a itilize sèlman `jose`, ki konpatib ak Edge Runtime — kontrèman
// ak bcryptjs, ki bezwen Node.js. `middleware.ts` DWE enpòte de la a, jamè
// de `auth.ts` (ki gen bcryptjs), otreman build la ka echwe oswa kraze sou
// Edge Runtime Vercel la.

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "changeme-in-production"
);

export type UserRole = "admin" | "gestionnaire" | "caissier";

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
    .sign(secret);
}

export async function verifySession(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    // Yon token "pwchange" pa ka janm sèvi kòm yon sesyon konplè.
    if (payload.purpose) return null;
    // Kont dezaktive: sesyon an invalid imedyatman (pa bezwen tann 7 jou JWT la fini).
    const email = String((payload as { email?: string }).email ?? "").toLowerCase();
    if (!email || (await redis.sismember("users:disabled", email))) return null;
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/** Contrôle d'accès basé sur les rôles (RBAC) */
export const permissions: Record<UserRole, string[]> = {
  admin: ["*"],
  gestionnaire: ["sales:write", "stock:read", "invoices:write", "reports:read"],
  caissier: ["sales:write", "invoices:print"],
};

export function can(role: UserRole, action: string): boolean {
  const allowed = permissions[role];
  return allowed.includes("*") || allowed.includes(action);
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
    .sign(secret);
}

export async function verifyPwChangeToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (payload.purpose !== "pwchange" || typeof payload.email !== "string") return null;
    return payload.email;
  } catch {
    return null;
  }
}
