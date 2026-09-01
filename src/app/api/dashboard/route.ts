import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/upstash";
import { verifySession } from "@/lib/auth";
import type { Expense, Product, Sale } from "@/types";

function monthDates(): string[] {
  const now = new Date();
  const dates: string[] = [];
  for (let d = 1; d <= now.getDate(); d++) {
    const date = new Date(now.getFullYear(), now.getMonth(), d);
    dates.push(date.toISOString().slice(0, 10));
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
  const daysThisMonth = monthDates();

  // Kolekte vant ak depans pou chak jou nan mwa a (jodi a enkli)
  let monthRevenue = 0;
  let monthSalesCount = 0;
  let monthExpenses = 0;
  let todayRevenue = 0;
  let todaySalesCount = 0;
  let todayExpenses = 0;
  let recentSales: { id: string; total: number; createdAt: string }[] = [];

  for (const date of daysThisMonth) {
    const saleIds = await redis.lrange(`business:${businessId}:sales:${date}`, 0, -1);
    const sales = saleIds.length
      ? await Promise.all(saleIds.map((id) => redis.hgetall<Sale>(`sale:${id}`)))
      : [];
    const validSales = sales.filter((s): s is Sale => !!s);
    const dayRevenue = validSales.reduce((sum, s) => sum + s.total, 0);
    monthRevenue += dayRevenue;
    monthSalesCount += validSales.length;

    const expenseIds = await redis.lrange(`business:${businessId}:expenses:${date}`, 0, -1);
    const expenses = expenseIds.length
      ? await Promise.all(expenseIds.map((id) => redis.hgetall<Expense>(`expense:${id}`)))
      : [];
    const dayExpenses = expenses
      .filter((e): e is Expense => !!e)
      .reduce((sum, e) => sum + e.amount, 0);
    monthExpenses += dayExpenses;

    if (date === today) {
      todayRevenue = dayRevenue;
      todaySalesCount = validSales.length;
      todayExpenses = dayExpenses;
      recentSales = validSales
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
        .slice(0, 5)
        .map((s) => ({ id: s.id, total: s.total, createdAt: s.createdAt }));
    }
  }

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
    monthProfit: monthRevenue - monthExpenses,
    outOfStockCount,
    stockValue,
    lowStock,
    recentSales,
  });
}
