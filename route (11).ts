import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/upstash";
import { verifySession } from "@/lib/auth";
import type { Business, Customer, Product, Sale } from "@/types";

/**
 * Kreye yon backup konplè pou yon antrepriz (pwodwi, kliyan, vant 30 dènye jou).
 * Ka lanse chak jou via yon Vercel Cron Job (`vercel.json` → crons).
 */
export async function POST(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });

  const { businessId } = await req.json();
  if (!businessId) {
    return NextResponse.json({ error: "businessId obligatwa." }, { status: 400 });
  }

  const business = await redis.hgetall<Business>(`business:${businessId}`);

  const productIds = await redis.smembers(`business:${businessId}:products`);
  const products = productIds.length
    ? await Promise.all(productIds.map((id) => redis.hgetall<Product>(`product:${id}`)))
    : [];

  const customerIds = await redis.smembers(`business:${businessId}:customers`);
  const customers = customerIds.length
    ? await Promise.all(customerIds.map((id) => redis.hgetall<Customer>(`customer:${id}`)))
    : [];

  const sales: Sale[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const date = d.toISOString().slice(0, 10);
    const ids = await redis.lrange(`business:${businessId}:sales:${date}`, 0, -1);
    if (ids.length) {
      const daySales = await Promise.all(ids.map((id) => redis.hgetall<Sale>(`sale:${id}`)));
      sales.push(...daySales.filter((s): s is Sale => !!s));
    }
  }

  const snapshot = {
    businessId,
    business,
    products,
    customers,
    sales,
    createdAt: new Date().toISOString(),
  };

  const backupId = `${businessId}:${snapshot.createdAt.slice(0, 10)}`;
  await redis.set(`backup:${backupId}`, snapshot);
  await redis.lpush(`business:${businessId}:backups`, backupId);
  await redis.ltrim(`business:${businessId}:backups`, 0, 29); // 30 dènye backup

  return NextResponse.json({ backupId, createdAt: snapshot.createdAt });
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });

  const businessId = req.nextUrl.searchParams.get("businessId");
  if (!businessId) {
    return NextResponse.json({ error: "businessId obligatwa." }, { status: 400 });
  }

  const backupIds = await redis.lrange(`business:${businessId}:backups`, 0, -1);
  return NextResponse.json({ backups: backupIds });
}
