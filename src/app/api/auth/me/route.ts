import { NextRequest, NextResponse } from "next/server";
import { verifySession, isSuperAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });

  return NextResponse.json({ email: session.email, role: session.role, isSuper: isSuperAdmin(session.email) });
}
