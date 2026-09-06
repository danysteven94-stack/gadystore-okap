import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/upstash";
import { verifySession } from "@/lib/auth";
import type { Subscription } from "@/app/api/subscriptions/route";

async function getSession(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  return token ? verifySession(token) : null;
}

function addOneMonth(dateStr: string): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });

  const { id } = await params;
  const sub = await redis.hgetall<Subscription>(`subscription:${id}`);
  if (!sub) return NextResponse.json({ error: "Abònman pa jwenn." }, { status: 404 });

  const nextPaymentDate = addOneMonth(sub.nextPaymentDate);
  const updates = { status: "active" as const, nextPaymentDate };

  await redis.hset(`subscription:${id}`, updates);

  const today = new Date().toISOString().slice(0, 10);
  await redis.lpush(
    `business:${sub.businessId}:subscription-payments:${today}`,
    JSON.stringify({ subscriptionId: id, amount: sub.monthlyPrice, date: today })
  );

  return NextResponse.json({ subscription: { ...sub, ...updates } });
}
