import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { redis } from "@/lib/upstash";
import { verifySession } from "@/lib/auth";
import { pushNotification } from "@/lib/notifications";
import type { Product } from "@/types";

const returnSchema = z.object({
  businessId: z.string(),
  productId: z.string(),
  qty: z.number().positive(),
  reason: z.string().min(1),
  saleId: z.string().optional(),
  refundAmount: z.number().nonnegative().default(0),
});

export interface ReturnRecord {
  id: string;
  businessId: string;
  productId: string;
  productName: string;
  qty: number;
  reason: string;
  saleId?: string;
  refundAmount: number;
  createdAt: string;
}

async function getSession(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  return token ? verifySession(token) : null;
}

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });

  const businessId = req.nextUrl.searchParams.get("businessId");
  if (!businessId) {
    return NextResponse.json({ error: "businessId obligatwa." }, { status: 400 });
  }

  const ids = await redis.lrange(`business:${businessId}:returns`, 0, 49);
  const returns = ids.length
    ? await Promise.all(ids.map((id) => redis.hgetall<ReturnRecord>(`return:${id}`)))
    : [];

  return NextResponse.json({ returns: returns.filter(Boolean) });
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });

  const body = await req.json();
  const parsed = returnSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { businessId, productId, qty, reason, saleId, refundAmount } = parsed.data;

  const product = await redis.hgetall<Product>(`product:${productId}`);
  if (!product) {
    return NextResponse.json({ error: "Pwodwi pa jwenn." }, { status: 404 });
  }

  // Remèt pwodwi a nan stòk otomatikman
  await redis.hincrby(`product:${productId}`, "stock", qty);

  const record: ReturnRecord = {
    id: randomUUID(),
    businessId,
    productId,
    productName: product.name,
    qty,
    reason,
    saleId,
    refundAmount,
    createdAt: new Date().toISOString(),
  };

  await redis.hset(`return:${record.id}`, record as unknown as Record<string, unknown>);
  await redis.lpush(`business:${businessId}:returns`, record.id);
  await redis.ltrim(`business:${businessId}:returns`, 0, 199);

  await pushNotification(
    businessId,
    "product_return",
    `Retou anrejistre: ${qty} × ${product.name} (${reason}).`
  );

  return NextResponse.json({ return: record }, { status: 201 });
}
