import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { redis } from "@/lib/upstash";
import { verifySession } from "@/lib/auth";
import type { Product } from "@/types";

const productSchema = z.object({
  businessId: z.string(),
  name: z.string().min(1),
  category: z.string().min(1),
  buyPrice: z.number().nonnegative(),
  sellPrice: z.number().nonnegative(),
  stock: z.number().nonnegative(),
  minStock: z.number().nonnegative(),
  imageUrl: z.string().url().optional(),
  barcode: z.string().optional(),
});

async function requireSession(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  return token ? verifySession(token) : null;
}

export async function GET(req: NextRequest) {
  const session = await requireSession(req);
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });

  const businessId = req.nextUrl.searchParams.get("businessId");
  if (!businessId) {
    return NextResponse.json({ error: "businessId obligatwa." }, { status: 400 });
  }

  const ids = await redis.smembers(`business:${businessId}:products`);
  const products = ids.length
    ? await Promise.all(ids.map((id) => redis.hgetall<Product>(`product:${id}`)))
    : [];

  const lowStock = products.filter((p) => p && p.stock <= p.minStock);

  return NextResponse.json({ products, lowStock });
}

export async function POST(req: NextRequest) {
  const session = await requireSession(req);
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });

  const body = await req.json();
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const product: Product = { id: randomUUID(), ...parsed.data };

  await redis.hset(`product:${product.id}`, product as unknown as Record<string, unknown>);
  await redis.sadd(`business:${product.businessId}:products`, product.id);

  return NextResponse.json({ product }, { status: 201 });
}
