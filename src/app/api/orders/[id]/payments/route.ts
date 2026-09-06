import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { redis } from "@/lib/upstash";
import { verifySession } from "@/lib/auth";
import type { Order } from "@/app/api/orders/route";

const paymentSchema = z.object({
  amount: z.number().positive(),
});

async function getSession(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  return token ? verifySession(token) : null;
}

function statusFor(total: number, deposit: number): Order["status"] {
  if (deposit <= 0) return "pending";
  if (deposit >= total) return "paid";
  return "partial";
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });

  const { id } = await params;
  const order = await redis.hgetall<Order>(`order:${id}`);
  if (!order) return NextResponse.json({ error: "Kòmand pa jwenn." }, { status: 404 });

  const body = await req.json();
  const parsed = paymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Antre yon montan valid." }, { status: 400 });
  }

  const newDeposit = Math.min(order.depositAmount + parsed.data.amount, order.totalAmount);
  const newBalance = order.totalAmount - newDeposit;
  const updates = {
    depositAmount: newDeposit,
    balance: newBalance,
    status: statusFor(order.totalAmount, newDeposit),
  };

  await redis.hset(`order:${id}`, updates);

  return NextResponse.json({ order: { ...order, ...updates } });
}
