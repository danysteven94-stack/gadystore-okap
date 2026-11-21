import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/upstash";
import { getUserBusinessIds } from "@/lib/shop";
import { requireCapitalAccess } from "@/lib/capital-auth";
import { computeCapital, computeCapitalForBusinesses } from "@/lib/capital";
import type { Business } from "@/types";

/**
 * GET /api/capital?businessId=X → kapital yon antrepriz
 * GET /api/capital              → kapital chak antrepriz + kapital global
 */
export async function GET(req: NextRequest) {
  const businessId = req.nextUrl.searchParams.get("businessId");
  const auth = await requireCapitalAccess(req, businessId);
  if ("error" in auth) return auth.error;

  if (businessId) {
    const b = await redis.hgetall<Business>(`business:${businessId}`);
    return NextResponse.json({ capital: await computeCapital(businessId, b?.name) });
  }

  const ids = await getUserBusinessIds(auth.session.email);
  const rows = await Promise.all(ids.map((id) => redis.hgetall<Business>(`business:${id}`)));
  const businesses = rows.filter((b): b is Business => !!b && !!b.id).map((b) => ({ id: b.id, name: b.name }));
  return NextResponse.json(await computeCapitalForBusinesses(businesses));
}
