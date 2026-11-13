import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { redis } from "@/lib/upstash";
import { getBusinessBySlug, rateLimit, findOrderByCode, samePhone, isTrue, toNum } from "@/lib/shop";
import type { Product } from "@/types";

interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  createdAt: string;
}

async function productOf(businessId: string, productId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(productId)) return null;
  const p = await redis.hgetall<Product>(`product:${productId}`);
  if (!p || p.businessId !== businessId || !isTrue(p.published)) return null;
  return p;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);
  if (!business) return NextResponse.json({ error: "Boutik pa jwenn." }, { status: 404 });
  const productId = req.nextUrl.searchParams.get("productId") ?? "";
  const p = await productOf(business.id, productId);
  if (!p) return NextResponse.json({ error: "Pwodwi pa jwenn." }, { status: 404 });

  const raw = await redis.lrange<Review>(`product:${productId}:reviews`, 0, 49);
  const reviews = raw.filter((r) => r && r.rating).map((r) => ({
    id: String(r.id),
    name: String(r.name),
    rating: toNum(r.rating),
    comment: String(r.comment ?? ""),
    createdAt: String(r.createdAt),
  }));
  const count = Math.max(0, toNum(p.ratingCount));
  const avg = count > 0 ? Math.round((toNum(p.ratingSum) / count) * 10) / 10 : 0;
  return NextResponse.json({ reviews, avg, count }, { headers: { "Cache-Control": "no-store" } });
}

const schema = z.object({
  productId: z.string(),
  rating: z.number().int().min(1).max(5),
  name: z.string().trim().min(2).max(40),
  comment: z.string().trim().max(500).default(""),
  orderCode: z.string().trim().min(4).max(12),
  phone: z.string().min(7).max(20),
});

// Se sèlman moun ki te achte pwodwi a (kòd kòmand + telefòn) ki ka bay yon avi — sa evite spam.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!(await rateLimit(req, "shop-review", 10, 3600))) {
    return NextResponse.json({ error: "Twòp demann. Eseye pita." }, { status: 429 });
  }
  const business = await getBusinessBySlug(slug);
  if (!business) return NextResponse.json({ error: "Boutik pa jwenn." }, { status: 404 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Mete non ou, yon nòt (1-5) ak kòd kòmand ou." }, { status: 400 });
  }
  const { productId, rating, name, comment, orderCode, phone } = parsed.data;

  const p = await productOf(business.id, productId);
  if (!p) return NextResponse.json({ error: "Pwodwi pa jwenn." }, { status: 404 });

  const order = await findOrderByCode(business.id, orderCode);
  const items = order && Array.isArray(order.items) ? (order.items as { productId?: string }[]) : [];
  if (
    !order ||
    order.source !== "shop" ||
    order.status === "cancelled" ||
    !samePhone(String(order.customerPhone ?? ""), phone) ||
    !items.some((i) => i.productId === productId)
  ) {
    return NextResponse.json(
      { error: "Nou pa jwenn yon kòmand ak pwodwi sa a pou kòd ak telefòn sa yo." },
      { status: 403 }
    );
  }

  const fresh = await redis.set(`review:done:${order.id}:${productId}`, "1", { nx: true });
  if (!fresh) return NextResponse.json({ error: "Ou deja bay yon avi pou pwodwi sa a." }, { status: 409 });

  const review: Review = { id: randomUUID(), name, rating, comment, createdAt: new Date().toISOString() };
  await redis.lpush(`product:${productId}:reviews`, review);
  await redis.ltrim(`product:${productId}:reviews`, 0, 199);
  await Promise.all([
    redis.hincrby(`product:${productId}`, "ratingSum", rating),
    redis.hincrby(`product:${productId}`, "ratingCount", 1),
  ]);

  return NextResponse.json({ ok: true, review }, { status: 201 });
}
