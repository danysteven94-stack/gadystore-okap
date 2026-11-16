import { NextRequest, NextResponse } from "next/server";
import { verifySession, isSuperAdmin } from "@/lib/auth";
import { getUserPlan } from "@/lib/plan-access";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });

  const plan = await getUserPlan(session.email);
  return NextResponse.json({
    email: session.email,
    role: session.role,
    isSuper: isSuperAdmin(session.email),
    plan: plan.id,
    planLabel: plan.label,
    shopAllowed: plan.publicShop,
    maxBusinesses: plan.maxBusinesses,
  });
}
