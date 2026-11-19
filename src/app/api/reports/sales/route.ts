import { NextRequest, NextResponse } from "next/server";
import { userOwnsBusiness } from "@/lib/shop";
import { redis, hgetallMany } from "@/lib/upstash";
import { eachDate, validateRange } from "@/lib/date-range";
import { verifySession } from "@/lib/auth";
import type { Sale } from "@/types";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });

  const businessId = req.nextUrl.searchParams.get("businessId");
  if (businessId && !(await userOwnsBusiness(session.email, businessId))) {
    return NextResponse.json({ error: "Aksè refize." }, { status: 403 });
  }
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to") ?? new Date().toISOString().slice(0, 10);

  if (!businessId || !from) {
    return NextResponse.json(
      { error: "businessId ak from (dat depa) obligatwa." },
      { status: 400 }
    );
  }

  const rangeError = validateRange(from, to);
  if (rangeError) return NextResponse.json({ error: rangeError }, { status: 400 });

  // Lis jou yo nan YON demann (pipeline), epi tout vant yo nan yon lòt.
  const dates = eachDate(from, to);
  const pipe = redis.pipeline();
  for (const date of dates) pipe.lrange(`business:${businessId}:sales:${date}`, 0, -1);
  const idLists = (await pipe.exec()) as string[][];
  const records = await hgetallMany<Sale>(idLists.flat().map((id) => `sale:${id}`));
  const allSales: Sale[] = records.filter((s): s is Sale => !!s);


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
