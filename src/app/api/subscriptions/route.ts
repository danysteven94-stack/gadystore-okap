import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { redis, hsetClean } from "@/lib/upstash";
import { verifySession } from "@/lib/auth";

export interface Subscription {
  [key: string]: unknown;
  id: string;
  businessId: string;
  customerName: string;
  customerId?: string;
  productName: string; // ex: Netflix, IPTV, Spotify
  monthlyPrice: number;
  status: "active" | "expired" | "cancelled";
  startDate: string;
  nextPaymentDate: string;
  createdAt: string;
}

const subscriptionSchema = z.object({
  businessId: z.string(),
  customerName: z.string().min(1),
  customerId: z.string().optional(),
  productName: z.string().min(1),
  monthlyPrice: z.number().positive(),
  startDate: z.string().min(1),
});

async function getSession(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  return token ? verifySession(token) : null;
}

function addOneMonth(dateStr: string): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });

  const businessId = req.nextUrl.searchParams.get("businessId");
  if (!businessId) {
    return NextResponse.json({ error: "businessId obligatwa." }, { status: 400 });
  }

  const ids = await redis.smembers(`business:${businessId}:subscriptions`);
  const subs = ids.length
    ? await Promise.all(ids.map((id) => redis.hgetall<Subscription>(`subscription:${id}`)))
    : [];

  const validSubs = subs.filter((s): s is Subscription => !!s);
  const today = new Date().toISOString().slice(0, 10);

  // Mete estati "expired" otomatikman si dat peman an pase
  for (const sub of validSubs) {
    if (sub.status === "active" && sub.nextPaymentDate < today) {
      sub.status = "expired";
    }
  }

  const monthlyRevenue = validSubs
    .filter((s) => s.status === "active")
    .reduce((sum, s) => sum + s.monthlyPrice, 0);

  return NextResponse.json({ subscriptions: validSubs, monthlyRevenue });
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });

  const body = await req.json();
  const parsed = subscriptionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { businessId, customerName, customerId, productName, monthlyPrice, startDate } =
    parsed.data;

  const subscription: Subscription = {
    id: randomUUID(),
    businessId,
    customerName,
    customerId,
    productName,
    monthlyPrice,
    status: "active",
    startDate,
    nextPaymentDate: addOneMonth(startDate),
    createdAt: new Date().toISOString(),
  };

  await hsetClean(
    `subscription:${subscription.id}`,
    subscription as unknown as Record<string, unknown>
  );
  await redis.sadd(`business:${businessId}:subscriptions`, subscription.id);

  return NextResponse.json({ subscription }, { status: 201 });
}
