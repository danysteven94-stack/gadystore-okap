import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { redis, hsetClean } from "@/lib/upstash";
import { verifySession } from "@/lib/auth";
import { pushNotification } from "@/lib/notifications";
import type { Product } from "@/types";

export interface InventoryDiscrepancy {
  productId: string;
  name: string;
  systemQty: number;
  countedQty: number;
  difference: number; // countedQty - systemQty
}

export interface InventorySession {
  [key: string]: unknown;
  id: string;
  businessId: string;
  itemsCounted: number;
  discrepancies: InventoryDiscrepancy[];
  createdAt: string;
  createdBy: string;
}

const inventorySchema = z.object({
  businessId: z.string(),
  counts: z
    .array(
      z.object({
        productId: z.string(),
        countedQty: z.number().nonnegative(),
      })
    )
    .min(1),
});

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

  const ids = await redis.lrange(`business:${businessId}:inventory`, 0, 24);
  const sessions = ids.length
    ? await Promise.all(ids.map((id) => redis.hgetall<InventorySession>(`inventory:${id}`)))
    : [];

  return NextResponse.json({ sessions: sessions.filter(Boolean) });
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });

  const body = await req.json();
  const parsed = inventorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { businessId, counts } = parsed.data;

  const discrepancies: InventoryDiscrepancy[] = [];

  for (const { productId, countedQty } of counts) {
    const product = await redis.hgetall<Product>(`product:${productId}`);
    if (!product) continue;

    const difference = countedQty - product.stock;
    if (difference !== 0) {
      discrepancies.push({
        productId,
        name: product.name,
        systemQty: product.stock,
        countedQty,
        difference,
      });
    }

    // Ajiste stok la pou matche kantite konte a (kontwòl fizik la se sous
    // verite a apre yon envantè).
    await hsetClean(`product:${productId}`, { stock: countedQty });
  }

  const inventorySession: InventorySession = {
    id: randomUUID(),
    businessId,
    itemsCounted: counts.length,
    discrepancies,
    createdAt: new Date().toISOString(),
    createdBy: session.email,
  };

  await hsetClean(
    `inventory:${inventorySession.id}`,
    inventorySession as unknown as Record<string, unknown>
  );
  await redis.lpush(`business:${businessId}:inventory`, inventorySession.id);
  await redis.ltrim(`business:${businessId}:inventory`, 0, 49);

  if (discrepancies.length > 0) {
    await pushNotification(
      businessId,
      "low_stock",
      `Envantè fèt — ${discrepancies.length} pwodwi te gen diferans ant sistèm ak konte fizik.`
    );
  }

  return NextResponse.json({ session: inventorySession }, { status: 201 });
}
