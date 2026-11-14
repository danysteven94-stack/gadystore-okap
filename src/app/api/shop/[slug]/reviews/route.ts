import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { redis } from "@/lib/upstash";
import { getBusinessBySlug, rateLimit, findOrderByCode } from "@/lib/shop";
import { samePhone } from "@/lib/shop-utils";
import type { Product } from "@/types";

interface Review {
  id: string;
  productId: string;
  name: string;
  rating: number;
  comment: string;
  createdAt: string;
}

function asReview(x: unknown): Review | null {
  if (typeof x === "string") {
    try {
      return JSON.parse(x) as Review;
    } catch {
      return null;
    }
  }
  return x && typeof x === "object" ? (x as Review) : null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);
  if (!business) return NextResponse.json({ error: "Boutik pa jwenn." }, { status: 404 });
  const productId = req.nextUrl.searchParams.get("productId") ?? "";
  const product = await redis.hgetall<Product>(`product:${productId}`);
  if (!product || product.businessId !== business.id) {
    return NextResponse.json({ error: "Pwodwi pa jwenn." }, { status: 404 });
  }
  const raw = await redis.lrange(`product:${productId}:reviews`, 0, 49);
  const reviews = raw.map(asReview).filter((r): r is Review => !!r);
  return NextResponse.json({ reviews }, { headers: { "Cache-Control": "no-store" } });
}

const schema = z.object({
  productId: z.string(),
  code: z.string().min(4).max(12),
  phone: z.string().min(7).max(20),
  name: z.string().trim().min(2).max(40),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(500).default(""),
});

// Sèlman moun ki te achte pwodwi a (kòd kòmand + telefòn) ka bay yon avi — yon sèl pa kòmand.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!(await rateLimit(req, "shop-review", 10, 3600))) {
    return NextResponse.json({ error: "Twòp tantativ. Eseye pita." }, { status: 429 });
  }
  const business = await getBusinessBySlug(slug);
  if (!business) return NextResponse.json({ error: "Boutik pa jwenn." }, { status: 404 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ranpli non ou ak yon nòt de 1 a 5." }, { status: 400 });
  const d = parsed.data;

  const order = await findOrderByCode(business.id, d.code);
  if (!order || order.businessId !== business.id || !samePhone(String(order.customerPhone ?? ""), d.phone)) {
    return NextResponse.json({ error: "Pa jwenn kòmand. Verifye kòd la ak nimewo telefòn ou." }, { status: 404 });
  }
  if (!order.items?.some((i) => i.productId === d.productId)) {
    return NextResponse.json({ error: "Kòmand sa a pa gen pwodwi sa a." }, { status: 400 });
  }
  if (order.status === "cancelled" || !(order.status === "paid" || order.fulfillment === "delivered")) {
    return NextResponse.json({ error: "Ou ka bay avi apre w fin resevwa epi peye kòmand lan." }, { status: 403 });
  }

  const lock = await redis.set(`review:lock:${order.id}:${d.productId}`, "1", { nx: true });
  if (!lock) return NextResponse.json({ error: "Ou deja bay yon avi pou pwodwi sa a." }, { status: 409 });

  const review: Review = {
    id: randomUUID(),
    productId: d.productId,
    name: d.name,
    rating: d.rating,
    comment: d.comment,
    createdAt: new Date().toISOString(),
  };
  await redis.lpush(`product:${d.productId}:reviews`, JSON.stringify(review));
  await redis.hincrby(`product:${d.productId}`, "ratingSum", d.rating);
  await redis.hincrby(`product:${d.productId}`, "ratingCount", 1);

  return NextResponse.json({ review }, { status: 201 });
}
