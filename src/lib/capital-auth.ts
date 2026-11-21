import { NextRequest, NextResponse } from "next/server";
import { verifySession, can } from "@/lib/auth";
import { userOwnsBusiness } from "@/lib/shop";

/**
 * Kapital/envestisman se done sansib: sèlman admin ("*"). Si w vle louvri l pou jestyonè,
 * ranplase "*" pa "reports:read" isit la (yon sèl kote).
 */
export const CAPITAL_PERMISSION = "*";

export async function requireCapitalAccess(req: NextRequest, businessId?: string | null) {
  const token = req.cookies.get("session")?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return { error: NextResponse.json({ error: "Pa otorize." }, { status: 401 }) } as const;
  if (!can(session.role, CAPITAL_PERMISSION)) {
    return { error: NextResponse.json({ error: "Aksè refize." }, { status: 403 }) } as const;
  }
  if (businessId && !(await userOwnsBusiness(session.email, businessId))) {
    return { error: NextResponse.json({ error: "Aksè refize." }, { status: 403 }) } as const;
  }
  return { session } as const;
}
