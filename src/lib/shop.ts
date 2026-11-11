import type { NextRequest } from "next/server";
import { redis } from "@/lib/upstash";
import { verifySession } from "@/lib/auth";
import type { Business, Product } from "@/types";

export function slugify(input: string): string {
  return (
    input
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "boutik"
  );
}

export const RESERVED_SLUGS = new Set(["api", "admin", "login", "dashboard", "shop"]);

/** Reyalize yon slug ki pa pran. `ownBusinessId` pèmèt yon biznis kenbe pwòp slug li. */
export async function uniqueSlug(base: string, ownBusinessId?: string): Promise<string> {
  let slug = slugify(base);
  if (RESERVED_SLUGS.has(slug)) slug = `${slug}-shop`;
  let candidate = slug;
  for (let i = 2; i < 50; i++) {
    const owner = await redis.get<string>(`shop:slug:${candidate}`);
    if (!owner || owner === ownBusinessId) return candidate;
    candidate = `${slug}-${i}`;
  }
  return `${slug}-${Date.now().toString(36)}`;
}

export async function getSessionFromReq(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  return token ? verifySession(token) : null;
}

/** Sous verite a se dosye itilizatè a nan Redis (JWT la ka pa ajou). */
export async function getUserBusinessIds(email: string): Promise<string[]> {
  const rec = await redis.hgetall<{ businessIds?: string | string[] }>(`user:${email}`);
  const raw = rec?.businessIds;
  if (Array.isArray(raw)) return raw;
  try {
    return JSON.parse(raw || "[]");
  } catch {
    return [];
  }
}

export async function userOwnsBusiness(email: string, businessId: string) {
  return (await getUserBusinessIds(email)).includes(businessId);
}

export async function getBusinessBySlug(slug: string): Promise<Business | null> {
  const id = await redis.get<string>(`shop:slug:${slug.toLowerCase()}`);
  if (!id) return null;
  const business = await redis.hgetall<Business>(`business:${id}`);
  if (!business || !business.id) return null;
  if (!isTrue(business.shopEnabled)) return null;
  return business;
}

export interface PublicProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  unit: string;
  imageUrl: string | null;
  description: string | null;
}

export interface PublicShop {
  slug: string;
  name: string;
  logoUrl: string | null;
  coverUrl: string | null;
  tagline: string;
  currency: string;
  whatsapp: string | null;
  paymentInfo: string | null;
  products: PublicProduct[];
}

/** Voye sèlman sa kliyan an dwe wè — JAMÈ pri acha, stok minimòm, kòd ba, elt. */
export async function getPublicShop(slug: string): Promise<PublicShop | null> {
  const business = await getBusinessBySlug(slug);
  if (!business) return null;

  const ids = await redis.smembers(`business:${business.id}:products`);
  const rows = ids.length
    ? await Promise.all(ids.map((id) => redis.hgetall<Product>(`product:${id}`)))
    : [];

  const products: PublicProduct[] = rows
    .filter((p): p is Product => !!p && !!p.id && isTrue(p.published))
    .map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: Number(p.sellPrice) || 0,
      stock: Math.max(0, Number(p.stock) || 0),
      unit: p.unit ? String(p.unit) : "",
      imageUrl: (p.imageUrl as string) || null,
      description: p.description ? String(p.description) : null,
    }))
    // disponib anvan, apre alfabetik
    .sort((a, b) => Number(b.stock > 0) - Number(a.stock > 0) || a.name.localeCompare(b.name));

  return {
    slug: business.slug || slug,
    name: String(business.shopName ?? "").trim() || String(business.name),
    logoUrl: business.shopLogo ? String(business.shopLogo) : null,
    coverUrl: business.shopCover ? String(business.shopCover) : null,
    tagline: String(business.shopTagline || "Katalòg & Kòmand"),
    currency: business.currency || "HTG",
    whatsapp: business.whatsapp ? String(business.whatsapp).replace(/\D/g, "") : null,
    paymentInfo: business.shopPaymentInfo ? String(business.shopPaymentInfo) : null,
    products,
  };
}

export function isTrue(v: unknown) {
  return v === true || v === "true";
}

/** Limit senp pa IP (Redis INCR + EXPIRE). Retounen true si rete nan limit la. */
export async function rateLimit(req: NextRequest, bucket: string, max: number, windowSec: number) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const key = `rl:${bucket}:${ip}`;
  const n = await redis.incr(key);
  if (n === 1) await redis.expire(key, windowSec);
  return n <= max;
}

export function cleanPhone(v: string) {
  return v.replace(/[^\d+]/g, "");
}
