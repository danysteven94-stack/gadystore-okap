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

/** Pwodwi online (dijital): pa gen stok fizik, kòb li pa konte nan valè stok la. */
export function isDigital(p: { productType?: unknown }) {
  return p.productType === "digital";
}

export function isTrue(v: unknown) {
  return v === true || v === "true";
}

/** Yon chan boolean ki ka manke: si pa gen valè, itilize `fallback`. */
export function flag(v: unknown, fallback: boolean) {
  if (v === undefined || v === null || v === "") return fallback;
  return isTrue(v);
}

export function toNum(v: unknown, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

/** Upstash ka retounen yon tablo oswa yon string JSON — nou aksepte tou de. */
export function toArr(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === "string");
  if (typeof v === "string" && v.trim().startsWith("[")) {
    try {
      const a = JSON.parse(v);
      return Array.isArray(a) ? a.filter((x): x is string => typeof x === "string") : [];
    } catch {
      return [];
    }
  }
  return [];
}

/** Opsyon pwodwi (gwosè/koulè): "S, M, L" -> ["S","M","L"]. Karaktè "|" pa pèmèt (li sèvi nan kle panye a). */
export function optList(v: unknown): string[] {
  const raw = Array.isArray(v) ? v.map(String) : typeof v === "number" ? [String(v)] : typeof v === "string" ? v.split(",") : [];
  const out: string[] = [];
  for (const x of raw) {
    const t = x.replace(/\|/g, "").trim().slice(0, 40);
    if (t && !out.includes(t)) out.push(t);
  }
  return out.slice(0, 30);
}

export interface PublicProduct {
  id: string;
  name: string;
  category: string;
  brand: string;
  price: number;
  comparePrice: number | null; // ansyen pri si gen rabè
  stock: number;
  unit: string;
  imageUrl: string | null;
  images: string[]; // tout foto yo (premye a = imageUrl)
  description: string | null;
  featured: boolean;
  sizes: string[];
  colors: string[];
  createdAt: string | null;
  sold: number;
  rating: number; // mwayèn 0-5
  ratingCount: number;
  digital: boolean; // pwodwi online
  leadDays: number; // jou pou li rive (0 = pa defini)
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
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  deliveryFee: number;
  freeShippingMin: number;
  deliveryMinDays: number;
  deliveryMaxDays: number;
  address: string | null;
  hours: string | null;
  policies: string | null;
  facebook: string | null;
  instagram: string | null;
  products: PublicProduct[];
}

function socialUrl(kind: "facebook" | "instagram", v: unknown): string | null {
  const raw = String(v ?? "").trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  const handle = raw.replace(/^@/, "").replace(/[^A-Za-z0-9._-]/g, "");
  if (!handle) return null;
  return kind === "facebook" ? `https://facebook.com/${handle}` : `https://instagram.com/${handle}`;
}

/** Fòma piblik yon pwodwi — JAMÈ pri acha, stok minimòm, kòd ba, elt. */
export function toPublicProduct(p: Product): PublicProduct {
  const main = p.imageUrl ? String(p.imageUrl) : "";
  const images = [main, ...toArr(p.images)].filter((x, i, a) => !!x && a.indexOf(x) === i);
  const price = toNum(p.sellPrice);
  const compare = toNum(p.comparePrice);
  const ratingCount = Math.max(0, toNum(p.ratingCount));
  const ratingSum = Math.max(0, toNum(p.ratingSum));
  return {
    id: String(p.id),
    name: String(p.name),
    category: String(p.category),
    brand: p.brand ? String(p.brand) : "",
    price,
    comparePrice: compare > price ? compare : null,
    stock: isDigital(p) ? 9999 : Math.max(0, toNum(p.stock)), // online = san limit
    unit: p.unit ? String(p.unit) : "",
    imageUrl: images[0] ?? null,
    images,
    description: p.description ? String(p.description) : null,
    featured: isTrue(p.featured),
    sizes: optList(p.sizes),
    colors: optList(p.colors),
    createdAt: p.createdAt ? String(p.createdAt) : null,
    sold: Math.max(0, toNum(p.sold)),
    rating: ratingCount > 0 ? Math.round((ratingSum / ratingCount) * 10) / 10 : 0,
    ratingCount,
    digital: isDigital(p),
    leadDays: Math.max(0, Math.floor(toNum(p.leadDays))),
  };
}

export function shopDisplayName(business: Business) {
  return String(business.shopName ?? "").trim() || String(business.name);
}

export async function getPublicShop(slug: string): Promise<PublicShop | null> {
  const business = await getBusinessBySlug(slug);
  if (!business) return null;

  const ids = await redis.smembers(`business:${business.id}:products`);
  const rows = ids.length
    ? await Promise.all(ids.map((id) => redis.hgetall<Product>(`product:${id}`)))
    : [];

  const products: PublicProduct[] = rows
    .filter((p): p is Product => !!p && !!p.id && isTrue(p.published))
    .map(toPublicProduct)
    // pwodwi vedèt anvan, disponib anvan, apre alfabetik
    .sort(
      (a, b) =>
        Number(b.featured) - Number(a.featured) ||
        Number(b.stock > 0) - Number(a.stock > 0) ||
        a.name.localeCompare(b.name)
    );

  const str = (v: unknown) => (v ? String(v).trim() || null : null);

  return {
    slug: business.slug || slug,
    name: shopDisplayName(business),
    logoUrl: str(business.shopLogo),
    coverUrl: str(business.shopCover),
    tagline: String(business.shopTagline || "Katalòg & Kòmand"),
    currency: business.currency || "HTG",
    whatsapp: business.whatsapp ? String(business.whatsapp).replace(/\D/g, "") : null,
    paymentInfo: str(business.shopPaymentInfo),
    announcement: str(business.shopAnnouncement),
    deliveryEnabled: flag(business.shopDeliveryEnabled, true),
    pickupEnabled: flag(business.shopPickupEnabled, true),
    deliveryFee: Math.max(0, toNum(business.shopDeliveryFee)),
    freeShippingMin: Math.max(0, toNum(business.shopFreeShippingMin)),
    deliveryMinDays: Math.max(0, Math.floor(toNum(business.shopDeliveryMinDays))),
    deliveryMaxDays: Math.max(0, Math.floor(toNum(business.shopDeliveryMaxDays))),
    address: str(business.shopAddress),
    hours: str(business.shopHours),
    policies: str(business.shopPolicies),
    facebook: socialUrl("facebook", business.shopFacebook),
    instagram: socialUrl("instagram", business.shopInstagram),
    products,
  };
}

/** Yon sèl pwodwi (pou paj pwodwi a: SEO/metadata) — pa chaje tout katalòg la. */
export async function getPublicProduct(slug: string, id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const business = await getBusinessBySlug(slug);
  if (!business) return null;
  const p = await redis.hgetall<Product>(`product:${id}`);
  if (!p || !p.id || p.businessId !== business.id || !isTrue(p.published)) return null;
  return {
    shopName: shopDisplayName(business),
    currency: business.currency || "HTG",
    product: toPublicProduct(p),
  };
}

/* ------------------------------ Koupon ------------------------------ */

export interface Coupon {
  code: string;
  type: "percent" | "fixed";
  value: number;
  minOrder: number;
  maxUses: number; // 0 = san limit
  uses: number;
  expiresAt: string; // YYYY-MM-DD oswa ""
  active: boolean;
}

export function normCode(s: string) {
  return s.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 20);
}

export async function getCoupon(businessId: string, code: string): Promise<Coupon | null> {
  const c = normCode(code);
  if (!c) return null;
  const raw = await redis.hgetall<Record<string, unknown>>(`coupon:${businessId}:${c}`);
  if (!raw || !raw.code) return null;
  return {
    code: String(raw.code),
    type: raw.type === "fixed" ? "fixed" : "percent",
    value: toNum(raw.value),
    minOrder: toNum(raw.minOrder),
    maxUses: toNum(raw.maxUses),
    uses: toNum(raw.uses),
    expiresAt: raw.expiresAt ? String(raw.expiresAt) : "",
    active: flag(raw.active, true),
  };
}

export function couponProblem(c: Coupon, subtotal: number): string | null {
  if (!c.active) return "Kòd promosyon sa a pa aktif.";
  if (c.expiresAt) {
    const end = new Date(c.expiresAt.length === 10 ? `${c.expiresAt}T23:59:59` : c.expiresAt).getTime();
    if (Number.isFinite(end) && end < Date.now()) return "Kòd promosyon sa a ekspire.";
  }
  if (c.maxUses > 0 && c.uses >= c.maxUses) return "Kòd promosyon sa a rive nan limit li.";
  if (c.minOrder > 0 && subtotal < c.minOrder) {
    return `Kòd sa a mande omwen ${c.minOrder.toLocaleString("en-US")} nan kòmand lan.`;
  }
  return null;
}

export function couponDiscount(c: Coupon, subtotal: number) {
  const raw = c.type === "percent" ? (subtotal * Math.min(c.value, 100)) / 100 : c.value;
  return Math.min(Math.round(raw * 100) / 100, subtotal);
}

/* ------------------------------ Pri panye (sèvè a toujou deside) ------------------------------ */

export type DeliveryMethod = "delivery" | "pickup";

export interface PricedLine {
  productId: string;
  name: string;
  qty: number;
  unitPrice: number;
  unit: string;
  size?: string;
  color?: string;
  variant?: string; // "M / Wouj"
  digital?: boolean;
  leadDays?: number;
}

export type PriceResult =
  | {
      ok: true;
      lines: PricedLine[];
      subtotal: number;
      discount: number;
      shipping: number;
      total: number;
      freeShipping: boolean;
      couponCode: string | null;
      couponError: string | null;
    }
  | { ok: false; status: number; error: string };

export async function priceCart(
  business: Business,
  items: { productId: string; qty: number; size?: string; color?: string }[],
  method: DeliveryMethod,
  couponCode?: string
): Promise<PriceResult> {
  const deliveryOn = flag(business.shopDeliveryEnabled, true);
  const pickupOn = flag(business.shopPickupEnabled, true);
  if (method === "delivery" && !deliveryOn) return { ok: false, status: 400, error: "Boutik la pa fè livrezon." };
  if (method === "pickup" && !pickupOn) return { ok: false, status: 400, error: "Ranmase nan boutik la pa disponib." };

  // Menm pwodwi + menm gwosè + menm koulè = yon sèl liy
  const wanted = new Map<string, { productId: string; size: string; color: string; qty: number }>();
  for (const it of items) {
    const size = (it.size ?? "").trim();
    const color = (it.color ?? "").trim();
    const k = `${it.productId}|${size}|${color}`;
    const cur = wanted.get(k);
    if (cur) cur.qty += it.qty;
    else wanted.set(k, { productId: it.productId, size, color, qty: it.qty });
  }

  const found = new Map<string, Product>();
  const lines: PricedLine[] = [];
  for (const w of wanted.values()) {
    let p = found.get(w.productId);
    if (!p) {
      const row = await redis.hgetall<Product>(`product:${w.productId}`);
      if (!row || row.businessId !== business.id || !isTrue(row.published)) {
        return { ok: false, status: 404, error: "Yon pwodwi pa disponib ankò. Rafrechi paj la." };
      }
      p = row as Product;
      found.set(w.productId, p);
    }
    const sizes = optList(p.sizes);
    const colors = optList(p.colors);
    if ((sizes.length > 0 && !sizes.includes(w.size)) || (sizes.length === 0 && w.size)) {
      return { ok: false, status: 400, error: `Chwazi yon gwosè valid pou ${p.name}.` };
    }
    if ((colors.length > 0 && !colors.includes(w.color)) || (colors.length === 0 && w.color)) {
      return { ok: false, status: 400, error: `Chwazi yon koulè valid pou ${p.name}.` };
    }
    lines.push({
      productId: w.productId,
      name: String(p.name),
      qty: w.qty,
      unitPrice: toNum(p.sellPrice),
      unit: p.unit ? String(p.unit) : "",
      size: w.size || undefined,
      color: w.color || undefined,
      variant: [w.size, w.color].filter(Boolean).join(" / ") || undefined,
      digital: isDigital(p) || undefined,
      leadDays: Math.max(0, Math.floor(toNum(p.leadDays))) || undefined,
    });
  }

  const subtotal = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
  if (subtotal <= 0) return { ok: false, status: 400, error: "Pwodwi sa yo pa gen pri. Kontakte biznis la." };

  let discount = 0;
  let appliedCode: string | null = null;
  let couponError: string | null = null;
  if (couponCode && normCode(couponCode)) {
    const c = await getCoupon(business.id, couponCode);
    if (!c) couponError = "Kòd promosyon sa a pa egziste.";
    else {
      couponError = couponProblem(c, subtotal);
      if (!couponError) {
        discount = couponDiscount(c, subtotal);
        appliedCode = c.code;
      }
    }
  }

  const afterDiscount = subtotal - discount;
  const fee = Math.max(0, toNum(business.shopDeliveryFee));
  const freeMin = Math.max(0, toNum(business.shopFreeShippingMin));
  const freeShipping = method === "delivery" && freeMin > 0 && afterDiscount >= freeMin;
  const shipping = method === "delivery" && !freeShipping ? fee : 0;

  return {
    ok: true,
    lines,
    subtotal,
    discount,
    shipping,
    total: Math.round((afterDiscount + shipping) * 100) / 100,
    freeShipping,
    couponCode: appliedCode,
    couponError,
  };
}

/* ------------------------------ Kòmand: kòd + telefòn ------------------------------ */

/** Konpare 2 nimewo telefòn sou 8 dènye chif yo (kòd peyi/espas pa konte). */
export function samePhone(a: string, b: string) {
  const x = String(a).replace(/\D/g, "").slice(-8);
  const y = String(b).replace(/\D/g, "").slice(-8);
  return x.length >= 7 && x === y;
}

export async function findOrderByCode(businessId: string, code: string) {
  const c = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (c.length < 4) return null;
  let id = await redis.get<string>(`shop:ordercode:${businessId}:${c}`);
  if (!id) {
    // ansyen kòmand (anvan endèks la): chèche nan 300 dènye yo
    const ids = await redis.lrange(`business:${businessId}:orders`, 0, 299);
    for (const oid of ids) {
      if (String(oid).slice(0, 6).toUpperCase() === c) {
        id = String(oid);
        break;
      }
    }
  }
  if (!id) return null;
  const order = await redis.hgetall<Record<string, unknown>>(`order:${id}`);
  if (!order || order.businessId !== businessId) return null;
  return order;
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
