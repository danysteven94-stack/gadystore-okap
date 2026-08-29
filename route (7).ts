import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { redis } from "@/lib/upstash";
import { verifySession } from "@/lib/auth";
import { notifyLargeExpense } from "@/lib/notifications";
import type { Expense } from "@/types";

const expenseSchema = z.object({
  businessId: z.string(),
  category: z.enum([
    "salaires",
    "transport",
    "loyer",
    "electricite",
    "internet",
    "divers",
  ]),
  amount: z.number().positive(),
  note: z.string().optional(),
});

async function requireSession(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  return token ? verifySession(token) : null;
}

export async function GET(req: NextRequest) {
  const session = await requireSession(req);
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });

  const businessId = req.nextUrl.searchParams.get("businessId");
  const date = req.nextUrl.searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
  if (!businessId) {
    return NextResponse.json({ error: "businessId obligatwa." }, { status: 400 });
  }

  const ids = await redis.lrange(`business:${businessId}:expenses:${date}`, 0, -1);
  const expenses = ids.length
    ? await Promise.all(ids.map((id) => redis.hgetall<Expense>(`expense:${id}`)))
    : [];

  const total = expenses.reduce((sum, e) => sum + (e?.amount ?? 0), 0);

  return NextResponse.json({ expenses, total });
}

export async function POST(req: NextRequest) {
  const session = await requireSession(req);
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });

  const body = await req.json();
  const parsed = expenseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const expense: Expense = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    ...parsed.data,
  };

  await redis.hset(`expense:${expense.id}`, expense as unknown as Record<string, unknown>);
  const day = expense.createdAt.slice(0, 10);
  await redis.lpush(`business:${expense.businessId}:expenses:${day}`, expense.id);
  await notifyLargeExpense(expense.businessId, expense.amount);

  return NextResponse.json({ expense }, { status: 201 });
}
