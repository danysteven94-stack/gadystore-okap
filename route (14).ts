import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/upstash";
import { verifySession } from "@/lib/auth";
import type { Sale } from "@/types";

function eachDate(from: string, to: string): string[] {
  const dates: string[] = [];
  const cur = new Date(from);
  const end = new Date(to);
  while (cur <= end) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });

  const businessId = req.nextUrl.searchParams.get("businessId");
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to") ?? new Date().toISOString().slice(0, 10);

  if (!businessId || !from) {
    return NextResponse.json(
      { error: "businessId ak from (dat depa) obligatwa." },
      { status: 400 }
    );
  }

  const allSales: Sale[] = [];
  for (const date of eachDate(from, to)) {
    const ids = await redis.lrange(`business:${businessId}:sales:${date}`, 0, -1);
    if (ids.length) {
      const sales = await Promise.all(ids.map((id) => redis.hgetall<Sale>(`sale:${id}`)));
      allSales.push(...sales.filter((s): s is Sale => !!s));
    }
  }

  // Pi bon pwodwi vandi (kantite ak revni pa pwodwi)
  const byProduct = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const sale of allSales) {
    for (const item of sale.items) {
      const entry = byProduct.get(item.productId) ?? {
        name: item.name,
        qty: 0,
        revenue: 0,
      };
      entry.qty += item.qty;
      entry.revenue += item.qty * item.unitPrice;
      byProduct.set(item.productId, entry);
    }
  }

  const topProducts = [...byProduct.values()].sort((a, b) => b.revenue - a.revenue);

  const byPaymentMethod = allSales.reduce<Record<string, number>>((acc, s) => {
    acc[s.paymentMethod] = (acc[s.paymentMethod] ?? 0) + s.total;
    return acc;
  }, {});

  return NextResponse.json({
    period: { from, to },
    totalSales: allSales.length,
    totalRevenue: allSales.reduce((sum, s) => sum + s.total, 0),
    topProducts,
    byPaymentMethod,
  });
}
