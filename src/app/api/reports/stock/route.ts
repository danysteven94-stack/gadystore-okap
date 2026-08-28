import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/upstash";
import { verifySession } from "@/lib/auth";
import type { Product } from "@/types";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });

  const businessId = req.nextUrl.searchParams.get("businessId");
  if (!businessId) {
    return NextResponse.json({ error: "businessId obligatwa." }, { status: 400 });
  }

  const ids = await redis.smembers(`business:${businessId}:products`);
  const products = ids.length
    ? (await Promise.all(ids.map((id) => redis.hgetall<Product>(`product:${id}`)))).filter(
        (p): p is Product => !!p
      )
    : [];

  const available = products.filter((p) => p.stock > p.minStock);
  const low = products.filter((p) => p.stock > 0 && p.stock <= p.minStock);
  const outOfStock = products.filter((p) => p.stock <= 0);

  const totalStockValue = products.reduce((sum, p) => sum + p.stock * p.buyPrice, 0);

  return NextResponse.json({
    available,
    low,
    outOfStock,
    totalStockValue,
    summary: {
      totalProducts: products.length,
      availableCount: available.length,
      lowCount: low.length,
      outOfStockCount: outOfStock.length,
    },
  });
}
