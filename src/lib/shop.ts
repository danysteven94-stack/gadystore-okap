import { cache } from "react";
import type { NextRequest } from "next/server";
import { redis } from "@/lib/upstash";
import { verifySession } from "@/lib/auth";
import type { Business, Product } from "@/types";
import type { Order } from "@/app/api/orders/route";
import { deliveryFeeFor, variantLabel, type DeliveryMethod } from "@/lib/shop-utils";

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
  oldPrice: number | null;
  stock: number;
  unit: string;
  imageUrl: string | null;
  images: string[]; // tout foto yo (imageUrl an premye)
  description: string | null;
  brand: string | null;
  sizes: string[];
  colors: string[];
  createdAt: string | null;
  rating: number; // mwayèn 0-5
  ratingCount: number;
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
  announcement: string | null;
  about: string | null;
  returns: string | null;
  address: string | null;
  deliveryFee: number;
  freeDeliveryMin: number;
  pickup: boolean;
  products: PublicProduct[];
}

/** Tou sa ki ka vin kòm lis: tablo, "a,b,c" oswa yon sèl chif. */
export function toList(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  if (typeof v === "number") return [String(v)];
  if (typeof v !== "string" || !v.trim()) return [];
  const s = v.trim();
  if (s.startsWith("[")) {
    try {
      const a = JSON.parse(s);
      if (Array.isArray(a)) return a.map((x) => String(x).trim()).filter(Boolean);
    } catch {
      /* tonbe sou split */
    }
  }
  return s.split(",").map((x) => x.trim()).filter(Boolean);
}

/** Voye sèlman sa kliyan an dwe wè — JAMÈ pri acha, stok minimòm, kòd ba, elt. */
export const getPublicShop = cache(async (slug: string): Promise<PublicShop | null> => {
  const business = await getBusinessBySlug(slug);
  if (!business) return null;

  const ids = await redis.smembers(`business:${business.id}:products`);
  const rows = ids.length
    ? await Promise.all(ids.map((id) => redis.hgetall<Product>(`product:${id}`)))
    : [];

  const products: PublicProduct[] = rows
    .filter((p): p is Product => !!p && !!p.id && isTrue(p.published))
    .map((p) => {
      const price = Number(p.sellPrice) || 0;
      const old = Number(p.oldPrice) || 0;
      const main = (p.imageUrl as string) || null;
      const images = [...new Set([...(main ? [main] : []), ...toList(p.gallery)])].slice(0, 8);
      const count = Math.max(0, Number(p.ratingCount) || 0);
      const sum = Math.max(0, Number(p.ratingSum) || 0);
      return {
        id: p.id,
        name: String(p.name),
        category: String(p.category),
        price,
        oldPrice: old > price ? old : null,
        stock: Math.max(0, Number(p.stock) || 0),
        unit: p.unit ? String(p.unit) : "",
        imageUrl: main || images[0] || null,
        images,
        description: p.description ? String(p.description) : null,
        brand: p.brand ? String(p.brand) : null,
        sizes: toList(p.sizes),
        colors: toList(p.colors),
        createdAt: p.createdAt ? String(p.createdAt) : null,
        rating: count ? Math.round((sum / count) * 10) / 10 : 0,
        ratingCount: count,
      };
    })
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
    announcement: business.shopAnnouncement ? String(business.shopAnnouncement) : null,
    about: business.shopAbout ? String(business.shopAbout) : null,
    returns: business.shopReturns ? String(business.shopReturns) : null,
    address: business.shopAddress ? String(business.shopAddress) : null,
    deliveryFee: Math.max(0, Number(business.shopDeliveryFee) || 0),
    freeDeliveryMin: Math.max(0, Number(business.shopFreeDeliveryMin) || 0),
    pickup: isTrue(business.shopPickup),
    products,
  };
});

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

/** Jwenn yon kòmand pa kòd kout li (#ABC123). */
export async function findOrderByCode(businessId: string, rawCode: string): Promise<Order | null> {
  const code = rawCode.trim().toUpperCase().replace(/^#/, "");
  if (!/^[A-Z0-9]{4,10}$/.test(code)) return null;
  let id = await redis.get<string>(`ordercode:${businessId}:${code}`);
  if (!id) {
    // Ansyen kòmand (anvan endèks la): chèche nan 200 dènye yo
    const ids = await redis.lrange(`business:${businessId}:orders`, 0, 199);
    for (const oid of ids) {
      const o = await redis.hgetall<Order>(`order:${oid}`);
      if (o && String(o.code ?? "").toUpperCase() === code) return o;
    }
    return null;
  }
  const o = await redis.hgetall<Order>(`order:${id}`);
  return o && o.id ? o : null;
}

export interface CartInput {
  productId: string;
  qty: number;
  size?: string;
  color?: string;
}

export interface PricedLine {
  productId: string;
  name: string;
  qty: number;
  unitPrice: number;
  unit: string;
  variant?: string;
}

export type PriceResult =
  | {
      ok: true;
      lines: PricedLine[];
      products: Map<string, Product>;
      subtotal: number;
      deliveryFee: number;
      total: number;
    }
  | { ok: false; status: number; error: string };

/**
 * Kalkile panye a sou sèvè: pri yo soti nan baz done a (jamè nan navigatè a),
 * verifye gwosè/koulè, pwodwi pibliye, stok ak frè livrezon. Itilize pa /quote ak /orders.
 */
export async function priceCart(
  business: Business,
  items: CartInput[],
  deliveryMethod: DeliveryMethod
): Promise<PriceResult> {
  // Konbine liy repete (menm pwodwi + gwosè + koulè)
  const wanted = new Map<string, { productId: string; size: string; color: string; qty: number }>();
  for (const it of items) {
    const size = it.size || "";
    const color = it.color || "";
    const k = `${it.productId}|${size}|${color}`;
    const cur = wanted.get(k);
    if (cur) cur.qty += it.qty;
    else wanted.set(k, { productId: it.productId, size, color, qty: it.qty });
  }

  const products = new Map<string, Product>();
  const lines: PricedLine[] = [];
  for (const w of wanted.values()) {
    let p = products.get(w.productId);
    if (!p) {
      const row = await redis.hgetall<Product>(`product:${w.productId}`);
      if (!row || row.businessId !== business.id || !isTrue(row.published)) {
        return { ok: false, status: 404, error: "Yon pwodwi pa disponib ankò. Rafrechi paj la." };
      }
      p = row as Product;
      products.set(w.productId, p);
    }
    const sizes = toList(p.sizes);
    const colors = toList(p.colors);
    if ((sizes.length && !w.size) || (w.size && !sizes.includes(w.size))) {
      return { ok: false, status: 400, error: `Chwazi yon gwosè valid pou ${p.name}.` };
    }
    if ((colors.length && !w.color) || (w.color && !colors.includes(w.color))) {
      return { ok: false, status: 400, error: `Chwazi yon koulè valid pou ${p.name}.` };
    }
    lines.push({
      productId: w.productId,
      name: String(p.name),
      qty: w.qty,
      unitPrice: Number(p.sellPrice) || 0,
      unit: (p.unit as string) || "",
      variant: variantLabel(w.size, w.color) || undefined,
    });
  }

  // Stok la dwe sifi pou total pwodwi a (tout varyant ansanm)
  const perProduct = new Map<string, number>();
  for (const l of lines) perProduct.set(l.productId, (perProduct.get(l.productId) ?? 0) + l.qty);
  for (const [id, qty] of perProduct) {
    const p = products.get(id)!;
    if (qty > Math.max(0, Number(p.stock) || 0)) {
      return { ok: false, status: 409, error: `Stok ${p.name} pa sifi. Redwi kantite a.` };
    }
  }

  const subtotal = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
  if (subtotal <= 0) {
    return { ok: false, status: 400, error: "Pwodwi sa yo pa gen pri. Kontakte biznis la." };
  }
  const deliveryFee = deliveryFeeFor(
    {
      deliveryFee: Math.max(0, Number(business.shopDeliveryFee) || 0),
      freeDeliveryMin: Math.max(0, Number(business.shopFreeDeliveryMin) || 0),
    },
    subtotal,
    deliveryMethod
  );
  return { ok: true, lines, products, subtotal, deliveryFee, total: subtotal + deliveryFee };
}
