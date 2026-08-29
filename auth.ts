import bcrypt from "bcryptjs";

// Re-ekspòte tout sa ki nan session.ts (edge-safe) pou fichye ki deja
// enpòte de "@/lib/auth" kontinye mache san chanjman — SAF pou tout API
// route (yo woule sou Node.js, pa Edge). Sèl `middleware.ts` dwe enpòte
// dirèkteman de "@/lib/session" pou l pa antrene bcryptjs nan Edge bundle a.
export * from "@/lib/session";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
