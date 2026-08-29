import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/upstash";
import { verifySession } from "@/lib/auth";
import type { Expense, Product, Sale } from "@/types";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });

  const businessId = req.nextUrl.searchParams.get("businessId");
  if (!businessId) {
    return NextResponse.json({ error: "businessId obligatwa." }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);

  const saleIds = await redis.lrange(`business:${businessId}:sales:${today}`, 0, -1);
  const sales = saleIds.length
    ? await Promise.all(saleIds.map((id) => redis.hgetall<Sale>(`sale:${id}`)))
    : [];

  const expenseIds = await redis.lrange(
    `business:${businessId}:expenses:${today}`,
    0,
    -1
  );
  const expenses = expenseIds.length
    ? await Promise.all(expenseIds.map((id) => redis.hgetall<Expense>(`expense:${id}`)))
    : [];

  const productIds = await redis.smembers(`business:${businessId}:products`);
  const products = productIds.length
    ? await Promise.all(productIds.map((id) => redis.hgetall<Product>(`product:${id}`)))
    : [];

  const todayRevenue = sales.reduce((sum, s) => sum + (s?.total ?? 0), 0);
  const todayExpenses = expenses.reduce((sum, e) => sum + (e?.amount ?? 0), 0);
  const todayProfit = todayRevenue - todayExpenses;

  const lowStock = products
    .filter((p): p is Product => !!p && p.stock <= p.minStock)
    .map((p) => ({ id: p.id, name: p.name, stock: p.stock, minStock: p.minStock }));

  const recentSales = sales
    .filter((s): s is Sale => !!s)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 5)
    .map((s) => ({ id: s.id, total: s.total, createdAt: s.createdAt }));

  return NextResponse.json({
    todayRevenue,
    todaySales: sales.length,
    todayExpenses,
    todayProfit,
    lowStock,
    recentSales,
  });
}
