import { NextRequest, NextResponse } from "next/server";
import { userOwnsBusiness } from "@/lib/shop";
import { redis, hgetallMany } from "@/lib/upstash";
import { verifySession } from "@/lib/auth";
import { recordOrderSaleIfReady } from "@/lib/order-sale";
import type { Expense, Product, Sale } from "@/types";

interface ReturnRecordLite {
  [key: string]: unknown;
  refundAmount: number;
  createdAt: string;
}

function daysFromJan1ToToday(): string[] {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const dates: string[] = [];
  const cur = new Date(start);
  while (cur <= now) {
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
  if (businessId && !(await userOwnsBusiness(session.email, businessId))) {
    return NextResponse.json({ error: "Aksè refize." }, { status: 403 });
  }
  if (!businessId) {
    return NextResponse.json({ error: "businessId obligatwa." }, { status: 400 });
  }

  // Kòmand boutik + rattrapage: yon kòmand ki livre e peye men ki poko nan vant yo antre kounye a
  const orderIds = await redis.lrange(`business:${businessId}:orders`, 0, -1);
  const orderRows = await hgetallMany<{ status?: string; source?: string; fulfillment?: string; saleId?: string }>(
    orderIds.map((id) => `order:${id}`)
  );
  await Promise.all(
    orderIds.map(async (id, i) => {
      const o = orderRows[i];
      if (o && o.source === "shop" && String(o.status) === "paid" && String(o.fulfillment) === "delivered" && !o.saleId) {
        try {
          await recordOrderSaleIfReady(id, session.userId);
        } catch (e) {
          console.error("order sale backfill", e);
        }
      }
    })
  );

  const today = new Date().toISOString().slice(0, 10);
  const currentMonth = today.slice(0, 7); // YYYY-MM
  const allDates = daysFromJan1ToToday();

  // Chaje tout jou yo nan KÈLKE demann pipeline (pa 650+ apèl youn pa youn) — sinon dashboard la
  // twò dousman sou LTE epi aplikasyon an abandone l pou li montre vye kopi.
  const listPipe = redis.pipeline();
  for (const date of allDates) listPipe.lrange(`business:${businessId}:sales:${date}`, 0, -1);
  for (const date of allDates) listPipe.lrange(`business:${businessId}:expenses:${date}`, 0, -1);
  const lists = (await listPipe.exec()) as string[][];
  const saleLists = lists.slice(0, allDates.length);
  const expenseLists = lists.slice(allDates.length);

  const saleRecords = await hgetallMany<Sale>(saleLists.flat().map((id) => `sale:${id}`));
  const expenseRecords = await hgetallMany<Expense>(expenseLists.flat().map((id) => `expense:${id}`));
  let si = 0;
  let ei = 0;

  const dayResults = allDates.map((date, i) => {
    const validSales = saleRecords.slice(si, (si += saleLists[i].length)).filter((x): x is Sale => !!x);
    const validExpenses = expenseRecords.slice(ei, (ei += expenseLists[i].length)).filter((x): x is Expense => !!x);
    return {
      date,
      revenue: validSales.reduce((sum, x) => sum + Number(x.total), 0),
      salesCount: validSales.length,
      expenses: validExpenses.reduce((sum, x) => sum + Number(x.amount), 0),
      sales: validSales,
    };
  });

  const yearRevenue = dayResults.reduce((sum, d) => sum + d.revenue, 0);

  const monthDays = dayResults.filter((d) => d.date.startsWith(currentMonth));
  const monthRevenueGross = monthDays.reduce((sum, d) => sum + d.revenue, 0);
  const monthSalesCount = monthDays.reduce((sum, d) => sum + d.salesCount, 0);
  const monthExpenses = monthDays.reduce((sum, d) => sum + d.expenses, 0);

  const todayEntry = dayResults.find((d) => d.date === today);
  const todayRevenue = todayEntry?.revenue ?? 0;
  const todaySalesCount = todayEntry?.salesCount ?? 0;
  const todayExpenses = todayEntry?.expenses ?? 0;
  const recentSales = (todayEntry?.sales ?? [])
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 5)
    .map((s) => ({ id: s.id, total: s.total, createdAt: s.createdAt }));

  // Retou (dènye 200 antre yo) — filtre pou mwa aktyèl la
  const returnIds = await redis.lrange(`business:${businessId}:returns`, 0, 199);
  const returns = returnIds.length
    ? await Promise.all(returnIds.map((id) => redis.hgetall<ReturnRecordLite>(`return:${id}`)))
    : [];
  const monthReturns = returns
    .filter((r): r is ReturnRecordLite => !!r && r.createdAt?.startsWith(currentMonth))
    .reduce((sum, r) => sum + (r.refundAmount ?? 0), 0);

  // 7 dènye jou yo (vant net de retou − depans), pou grafik pwofi a
  const returnsByDate: Record<string, number> = {};
  for (const r of returns) {
    if (!r?.createdAt) continue;
    const d = String(r.createdAt).slice(0, 10);
    returnsByDate[d] = (returnsByDate[d] ?? 0) + (r.refundAmount ?? 0);
  }
  const weekly = dayResults.slice(-7).map((d) => {
    const net = d.revenue - (returnsByDate[d.date] ?? 0);
    return { date: d.date, revenue: net, profit: net - d.expenses };
  });

  const monthRevenue = monthRevenueGross - monthReturns; // net de retou, tankou "Net des retours"
  const monthProfit = monthRevenue - monthExpenses;

  // Kòmand (boutik an liy + manyèl)
  const activeOrders = orderRows.filter((o) => !!o && o.status !== "cancelled");
  const ordersCount = activeOrders.length;
  const newOrdersCount = activeOrders.filter((o) => o!.source === "shop" && (o!.fulfillment ?? "new") === "new").length;

  const productIds = await redis.smembers(`business:${businessId}:products`);
  const products = await hgetallMany<Product>(productIds.map((id) => `product:${id}`));
  // Pwodwi online pa konte nan stok (valè, stok ba, fini)
  const validProducts = products.filter((p): p is Product => !!p && !["digital", "dish"].includes(String(p.productType)) && !(p.comingSoon === true));

  const lowStock = validProducts
    .filter((p) => p.stock > 0 && p.stock <= p.minStock)
    .map((p) => ({ id: p.id, name: p.name, stock: p.stock, minStock: p.minStock }));

  const outOfStockCount = validProducts.filter((p) => p.stock <= 0).length;
  const stockValue = validProducts.reduce((sum, p) => sum + p.stock * p.buyPrice, 0);

  return NextResponse.json({
    todayRevenue,
    todaySales: todaySalesCount,
    todayExpenses,
    todayProfit: todayRevenue - todayExpenses,
    monthRevenue,
    monthSales: monthSalesCount,
    monthExpenses,
    monthProfit,
    monthReturns,
    yearRevenue,
    outOfStockCount,
    ordersCount,
    newOrdersCount,
    stockValue,
    lowStock,
    recentSales,
    weekly,
  });
}
