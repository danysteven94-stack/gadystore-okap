import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

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

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
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
