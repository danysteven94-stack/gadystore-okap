import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { redis } from "@/lib/upstash";
import { verifySession } from "@/lib/auth";
import { pushNotification } from "@/lib/notifications";

const purchaseSchema = z.object({
  businessId: z.string(),
  supplierId: z.string(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        name: z.string(),
        qty: z.number().positive(),
        unitCost: z.number().nonnegative(),
      })
    )
    .min(1),
});

interface Purchase {
  [key: string]: unknown;
  id: string;
  businessId: string;
  supplierId: string;
  items: { productId: string; name: string; qty: number; unitCost: number }[];
  total: number;
  createdAt: string;
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });

  const businessId = req.nextUrl.searchParams.get("businessId");
  if (!businessId) {
    return NextResponse.json({ error: "businessId obligatwa." }, { status: 400 });
  }

  const ids = await redis.lrange(`business:${businessId}:purchases`, 0, 49);
  const purchases = ids.length
    ? await Promise.all(ids.map((id) => redis.hgetall<Purchase>(`purchase:${id}`)))
    : [];

  return NextResponse.json({ purchases });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });

  const body = await req.json();
  const parsed = purchaseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { businessId, supplierId, items } = parsed.data;
  const total = items.reduce((sum, i) => sum + i.qty * i.unitCost, 0);

  const purchase: Purchase = {
    id: randomUUID(),
    businessId,
    supplierId,
    items,
    total,
    createdAt: new Date().toISOString(),
  };

  await redis.hset(`purchase:${purchase.id}`, purchase as unknown as Record<string, unknown>);
  await redis.lpush(`business:${businessId}:purchases`, purchase.id);
  await redis.lpush(`supplier:${supplierId}:purchases`, purchase.id);

  // Antre stòk otomatikman apre validasyon acha a
  for (const item of items) {
    await redis.hincrby(`product:${item.productId}`, "stock", item.qty);
  }

  await pushNotification(
    businessId,
    "new_purchase",
    `Nouvo acha anrejistre: ${total.toLocaleString("fr-FR")} G.`
  );

  return NextResponse.json({ purchase }, { status: 201 });
}
