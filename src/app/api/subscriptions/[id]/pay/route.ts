import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/upstash";
import { verifySession } from "@/lib/auth";
import { recordSubscriptionSale, undoSubscriptionSale } from "@/lib/subscription-sale";
import { canAccessSub, nextPaymentFor, parseIds, paymentsOf } from "@/lib/subscriptions";
import type { Subscription } from "@/app/api/subscriptions/route";

async function getSession(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  return token ? verifySession(token) : null;
}

async function load(req: NextRequest, params: Promise<{ id: string }>) {
  const session = await getSession(req);
  if (!session) return { error: NextResponse.json({ error: "Pa otorize." }, { status: 401 }) };
  const { id } = await params;
  const sub = await redis.hgetall<Subscription>(`subscription:${id}`);
  if (!sub) return { error: NextResponse.json({ error: "Abònman pa jwenn." }, { status: 404 }) };
  if (!(await canAccessSub(session.email, sub))) {
    return { error: NextResponse.json({ error: "Aksè refize." }, { status: 403 }) };
  }
  return { session, id, sub };
}

/** Make yon mwa kòm peye. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const r = await load(req, params);
  if (r.error) return r.error;
  const { session, id, sub } = r;

  const paymentsCount = paymentsOf(sub) + 1;
  const nextPaymentDate = nextPaymentFor(sub, paymentsCount);
  const saleIds = parseIds(sub.saleIds);

  // Chak peman mansyèl kontabilize kòm yon vant (revni/rapò/dashboard),
  // sèlman si abònman an anba yon antrepriz.
  if (sub.businessId) {
    const sale = await recordSubscriptionSale({
      businessId: String(sub.businessId),
      subscriptionId: id,
      productName: sub.productName,
      amount: sub.monthlyPrice,
      customerId: sub.customerId,
      cashierId: session.userId,
    });
    saleIds.push(sale.id);
  } else {
    saleIds.push("");
  }

  const updates = {
    status: "active" as const,
    paymentsCount,
    nextPaymentDate,
    saleIds: JSON.stringify(saleIds),
  };
  await redis.hset(`subscription:${id}`, updates);

  return NextResponse.json({ subscription: { ...sub, ...updates } });
}

/**
 * Anile DÈNYE peman an (si ou te make peye pa erè): abònman an tounen "pa peye"
 * epi vant ki te kreye a retire nan revni/rapò yo.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const r = await load(req, params);
  if (r.error) return r.error;
  const { id, sub } = r;

  const current = paymentsOf(sub);
  if (current <= 0) {
    return NextResponse.json({ error: "Pa gen peman pou anile." }, { status: 400 });
  }

  const paymentsCount = current - 1;
  const saleIds = parseIds(sub.saleIds);
  const lastSaleId = saleIds.pop();
  // Ansyen peman (anvan mizajou sa a) pa t sove ID vant la: nan ka sa a vant la rete.
  const saleRemoved = lastSaleId ? await undoSubscriptionSale(lastSaleId) : false;

  const updates = {
    paymentsCount,
    nextPaymentDate: nextPaymentFor(sub, paymentsCount),
    saleIds: JSON.stringify(saleIds),
  };
  await redis.hset(`subscription:${id}`, updates);

  return NextResponse.json({ subscription: { ...sub, ...updates }, saleRemoved });
}
