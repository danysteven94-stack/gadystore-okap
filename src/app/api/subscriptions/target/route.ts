import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/upstash";
import { verifySession } from "@/lib/auth";
import { userOwnsBusiness } from "@/lib/shop";
import { moveSubscriptionSales, salesBusinessFor } from "@/lib/subscriptions";

/** Chwazi ki antrepriz ki resevwa vant peman abònman pèsonèl yo (dashboard/rapò). */
export async function POST(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { businessId?: string } | null;
  const businessId = String(body?.businessId ?? "");
  if (!businessId || !(await userOwnsBusiness(session.email, businessId))) {
    return NextResponse.json({ error: "Aksè refize." }, { status: 403 });
  }
  await redis.hset(`user:${session.email}`, { subsBusinessId: businessId });
  const moved = await moveSubscriptionSales(session.email, businessId);
  return NextResponse.json({ businessId: await salesBusinessFor(session.email, { businessId: "" }), moved });
}
