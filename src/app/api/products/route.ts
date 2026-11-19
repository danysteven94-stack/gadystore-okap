import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { redis, hsetClean, hgetallMany } from "@/lib/upstash";
import { pageMeta, parsePage } from "@/lib/pagination";
import { verifySession } from "@/lib/auth";
import { userOwnsBusiness } from "@/lib/shop";
import type { Product } from "@/types";

const productSchema = z.object({
  businessId: z.string(),
  name: z.string().min(1),
  category: z.string().min(1),
  buyPrice: z.number().nonnegative(),
  sellPrice: z.number().nonnegative(),
  stock: z.number().nonnegative(),
  minStock: z.number().nonnegative(),
  imageUrl: z.string().refine((v) => v.startsWith("/api/img/") || /^https?:\/\//.test(v), "URL foto pa valid").optional(),
  published: z.boolean().optional(),
  images: z.array(z.string().refine((v) => v.startsWith("/api/img/") || /^https?:\/\//.test(v), "URL foto pa valid")).max(6).optional(),
  comparePrice: z.number().nonnegative().optional(),
  brand: z.string().max(60).optional(),
  sizes: z.string().max(200).optional(),
  colors: z.string().max(200).optional(),
  featured: z.boolean().optional(),
  comingSoon: z.boolean().optional(),
  productType: z.enum(["physical", "digital", "dish"]).optional(),
  tags: z.string().max(120).optional(),
  prepMinutes: z.number().int().min(0).max(240).optional(),
  unavailable: z.boolean().optional(),
  leadDays: z.number().int().min(0).max(365).optional(),
  unit: z.string().max(20).optional(),
  description: z.string().max(500).optional(),
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

  if (!(await userOwnsBusiness(session.email, businessId))) {
    return NextResponse.json({ error: "Aksè refize." }, { status: 403 });
  }

  const allIds = (await redis.smembers(`business:${businessId}:products`)).sort(); // lòd stab
  const sp = req.nextUrl.searchParams;
  // Konpatib: san ?limit, li retounen TOUT pwodwi yo (POS/envantè bezwen lis konplè a). Avèk ?limit=&offset=, li pajinen.
  const paged = sp.has("limit");
  const { limit, offset } = parsePage(sp, { defaultLimit: 50, maxLimit: 200 });
  const ids = paged ? allIds.slice(offset, offset + limit) : allIds;
  const products = await hgetallMany<Product>(ids.map((id) => `product:${id}`));

  const lowStock = products.filter((p) => p && p.stock <= p.minStock);

  return NextResponse.json({
    products,
    lowStock,
    ...(paged ? pageMeta(allIds.length, offset, ids.length) : { total: allIds.length, hasMore: false, nextOffset: null }),
  });
}

export async function POST(req: NextRequest) {
  const session = await requireSession(req);
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });

  const body = await req.json();
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (!(await userOwnsBusiness(session.email, parsed.data.businessId))) {
    return NextResponse.json({ error: "Aksè refize." }, { status: 403 });
  }

  const product: Product = { id: randomUUID(), ...parsed.data, createdAt: new Date().toISOString() };

  await hsetClean(`product:${product.id}`, product as unknown as Record<string, unknown>);
  await redis.sadd(`business:${product.businessId}:products`, product.id);

  return NextResponse.json({ product }, { status: 201 });
}
