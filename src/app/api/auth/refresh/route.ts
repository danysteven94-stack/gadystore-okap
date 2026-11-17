import { NextRequest, NextResponse } from "next/server";
import { verifySession, signSession, SESSION_MAX_AGE } from "@/lib/auth";

// Re-bay yon nouvo sesyon 1 èdtan si sesyon aktyèl la toujou valid (itilizatè a aktif).
export async function POST(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "Sesyon ekspire." }, { status: 401 });

  const { userId, email, role, businessIds } = session;
  const res = NextResponse.json({ ok: true });
  res.cookies.set("session", await signSession({ userId, email, role, businessIds }), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
  return res;
}
