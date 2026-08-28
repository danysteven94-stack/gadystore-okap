import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { redis } from "@/lib/upstash";
import { verifySession, can } from "@/lib/auth";
import { notifyLowStock, notifyNewSale } from "@/lib/notifications";
import type { Product, Sale } from "@/types";

const saleSchema = z.object({
  businessId: z.string(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        name: z.string(),
        qty: z.number().positive(),
        unitPrice: z.number().nonnegative(),
      })
    )
    .min(1),
  discount: z.number().nonnegative().default(0),
  taxRate: z.number().nonnegative().default(0), // pourcentage
  paymentMethod: z.enum(["cash", "card", "mobile_money", "mixed"]),
  customerId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });
  if (!can(session.role, "sales:write")) {
    return NextResponse.json({ error: "Aksè refize." }, { status: 403 });
  }

  const body = await req.json();
  const parsed = saleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { businessId, items, discount, taxRate, paymentMethod, customerId } =
    parsed.data;

  // Verifye epi debite stok la pou chak atik
  for (const item of items) {
    const product = await redis.hgetall<Product>(`product:${item.productId}`);
    if (!product) {
      return NextResponse.json(
        { error: `Pwodwi ${item.name} pa jwenn.` },
        { status: 404 }
      );
    }
    if (product.stock < item.qty) {
      return NextResponse.json(
        { error: `Stok ${item.name} pa sifi (${product.stock} rete).` },
        { status: 409 }
      );
    }
  }

  const subtotal = items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0);
  const afterDiscount = subtotal - discount;
  const tax = (afterDiscount * taxRate) / 100;
  const total = afterDiscount + tax;

  const sale: Sale = {
    id: randomUUID(),
    businessId,
    items,
    subtotal,
    discount,
    tax,
    total,
    paymentMethod,
    customerId,
    cashierId: session.userId,
    createdAt: new Date().toISOString(),
  };

  await redis.hset(`sale:${sale.id}`, sale as unknown as Record<string, unknown>);

  const today = sale.createdAt.slice(0, 10); // YYYY-MM-DD
  await redis.lpush(`business:${businessId}:sales:${today}`, sale.id);

  // Soti stok otomatikman epi verifye si sa deklannche yon alèt stok fèb
  for (const item of items) {
    const updatedStock = await redis.hincrby(
      `product:${item.productId}`,
      "stock",
      -item.qty
    );
    const product = await redis.hgetall<Product>(`product:${item.productId}`);
    if (product && updatedStock <= product.minStock) {
      await notifyLowStock(businessId, item.name);
    }
  }

  await notifyNewSale(businessId, sale.total);

  return NextResponse.json({ sale }, { status: 201 });
}
