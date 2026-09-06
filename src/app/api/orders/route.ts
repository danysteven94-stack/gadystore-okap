import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { redis } from "@/lib/upstash";
import { verifySession } from "@/lib/auth";
import { pushNotification } from "@/lib/notifications";

export interface Order {
  [key: string]: unknown;
  id: string;
  businessId: string;
  customerName: string;
  customerId?: string;
  description: string;
  totalAmount: number;
  depositAmount: number;
  balance: number; // dè — sa ki rete pou peye
  status: "pending" | "partial" | "paid";
  createdAt: string;
}

const orderSchema = z.object({
  businessId: z.string(),
  customerName: z.string().min(1),
  customerId: z.string().optional(),
  description: z.string().min(1),
  totalAmount: z.number().positive(),
  depositAmount: z.number().nonnegative().default(0),
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

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });

  const businessId = req.nextUrl.searchParams.get("businessId");
  if (!businessId) {
    return NextResponse.json({ error: "businessId obligatwa." }, { status: 400 });
  }

  const ids = await redis.lrange(`business:${businessId}:orders`, 0, 99);
  const orders = ids.length
    ? await Promise.all(ids.map((id) => redis.hgetall<Order>(`order:${id}`)))
    : [];

  const validOrders = orders.filter((o): o is Order => !!o);
  const totalOutstanding = validOrders.reduce((sum, o) => sum + o.balance, 0);

  return NextResponse.json({ orders: validOrders, totalOutstanding });
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });

  const body = await req.json();
  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { businessId, customerName, customerId, description, totalAmount, depositAmount } =
    parsed.data;

  const deposit = Math.min(depositAmount, totalAmount);
  const balance = totalAmount - deposit;

  const order: Order = {
    id: randomUUID(),
    businessId,
    customerName,
    customerId,
    description,
    totalAmount,
    depositAmount: deposit,
    balance,
    status: statusFor(totalAmount, deposit),
    createdAt: new Date().toISOString(),
  };

  await redis.hset(`order:${order.id}`, order as unknown as Record<string, unknown>);
  await redis.lpush(`business:${businessId}:orders`, order.id);

  if (balance > 0) {
    await pushNotification(
      businessId,
      "new_sale",
      `Nouvo kòmand pou ${customerName} — rete ${balance.toLocaleString("fr-FR")} G pou peye.`
    );
  }

  return NextResponse.json({ order }, { status: 201 });
}
