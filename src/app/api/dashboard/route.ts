import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/upstash";
import { verifySession } from "@/lib/auth";
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
  if (!businessId) {
    return NextResponse.json({ error: "businessId obligatwa." }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const currentMonth = today.slice(0, 7); // YYYY-MM
  const allDates = daysFromJan1ToToday();

  // Chaje tout jou an paralèl (pi rapid pase yonn apre lòt) pou n ka kalkile
  // total jodi a, mwa a, AK ane a nan menm pasaj la.
  const dayResults = await Promise.all(
    allDates.map(async (date) => {
      const saleIds = await redis.lrange(`business:${businessId}:sales:${date}`, 0, -1);
      const sales = saleIds.length
        ? await Promise.all(saleIds.map((id) => redis.hgetall<Sale>(`sale:${id}`)))
        : [];
      const validSales = sales.filter((s): s is Sale => !!s);

      const expenseIds = await redis.lrange(`business:${businessId}:expenses:${date}`, 0, -1);
      const expenses = expenseIds.length
        ? await Promise.all(expenseIds.map((id) => redis.hgetall<Expense>(`expense:${id}`)))
        : [];
      const validExpenses = expenses.filter((e): e is Expense => !!e);

      return {
        date,
        revenue: validSales.reduce((sum, s) => sum + s.total, 0),
        salesCount: validSales.length,
        expenses: validExpenses.reduce((sum, e) => sum + e.amount, 0),
        sales: validSales,
      };
    })
  );

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

  const monthRevenue = monthRevenueGross - monthReturns; // net de retou, tankou "Net des retours"
  const monthProfit = monthRevenue - monthExpenses;

  const productIds = await redis.smembers(`business:${businessId}:products`);
  const products = productIds.length
    ? await Promise.all(productIds.map((id) => redis.hgetall<Product>(`product:${id}`)))
    : [];
  const validProducts = products.filter((p): p is Product => !!p);

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
    stockValue,
    lowStock,
    recentSales,
  });
}
