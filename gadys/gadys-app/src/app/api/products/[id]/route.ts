import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { redis } from "@/lib/upstash";
import { verifySession } from "@/lib/auth";
import { notifyLowStock } from "@/lib/notifications";
import type { Product } from "@/types";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  buyPrice: z.number().nonnegative().optional(),
  sellPrice: z.number().nonnegative().optional(),
  stock: z.number().nonnegative().optional(),
  minStock: z.number().nonnegative().optional(),
  imageUrl: z.string().url().optional(),
  barcode: z.string().optional(),
});

async function requireSession(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  return token ? verifySession(token) : null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession(req);
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });

  const { id } = await params;
  const product = await redis.hgetall<Product>(`product:${id}`);
  if (!product) return NextResponse.json({ error: "Pwodwi pa jwenn." }, { status: 404 });

  return NextResponse.json({ product });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession(req);
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });

  const { id } = await params;
  const existing = await redis.hgetall<Product>(`product:${id}`);
  if (!existing) return NextResponse.json({ error: "Pwodwi pa jwenn." }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await redis.hset(`product:${id}`, parsed.data as Record<string, unknown>);

  const updated = { ...existing, ...parsed.data };
  if (updated.stock <= updated.minStock) {
    await notifyLowStock(existing.businessId, updated.name);
  }

  return NextResponse.json({ product: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession(req);
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });

  const { id } = await params;
  const existing = await redis.hgetall<Product>(`product:${id}`);
  if (!existing) return NextResponse.json({ error: "Pwodwi pa jwenn." }, { status: 404 });

  await redis.del(`product:${id}`);
  await redis.srem(`business:${existing.businessId}:products`, id);

  return NextResponse.json({ ok: true });
}
