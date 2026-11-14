import { SignJWT, jwtVerify } from "jose";
import type { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/upstash";
import { getBusinessBySlug } from "@/lib/shop";
import type { Business } from "@/types";

// Kont KLIYAN boutik la (separe nèt ak kont administratè/anplwaye yo).
//   shopcust:{id}                     -> hash (name, phone, email, address, passwordHash, businessId, createdAt)
//   shopcust:email:{businessId}:{em}  -> id  (inisite imèl pa boutik)
//   shopcust:{id}:orders              -> list ID kòmand yo
//   business:{businessId}:shopcustomers -> set ID kliyan yo
// Cookie: `shopcust_{slug}` (JWT ak purpose "shop-customer"). `verifySession` (admin) rejte
// nenpòt token ki gen `purpose`, kidonk yon kliyan pa ka janm vin administratè.

export interface ShopCustomer {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  createdAt: string;
}

function getSecret(): Uint8Array {
  const v = process.env.JWT_SECRET;
  if (!v && process.env.NODE_ENV === "production") throw new Error("JWT_SECRET manke nan varyab anviwònman yo.");
  return new TextEncoder().encode(v || "dev-only-secret");
}

const MAX_AGE = 60 * 60 * 24 * 30; // 30 jou

export const cookieName = (slug: string) => `shopcust_${slug}`;

export async function signCustomerToken(id: string, businessId: string) {
  return new SignJWT({ purpose: "shop-customer", bid: businessId })
    .setSubject(id)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());
}

export function setCustomerCookie(res: NextResponse, slug: string, token: string) {
  res.cookies.set(cookieName(slug), token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export function clearCustomerCookie(res: NextResponse, slug: string) {
  res.cookies.set(cookieName(slug), "", { httpOnly: true, secure: true, sameSite: "lax", maxAge: 0, path: "/" });
}

export function str(v: unknown) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

export function toCustomer(rec: Record<string, unknown>): ShopCustomer {
  return {
    id: str(rec.id),
    businessId: str(rec.businessId),
    name: str(rec.name),
    phone: str(rec.phone),
    email: str(rec.email),
    address: str(rec.address),
    createdAt: str(rec.createdAt),
  };
}

/** Retounen { business, customer } si cookie kliyan an valid POU BOUTIK SA A, sinon customer = null. */
export async function getShopCustomer(
  req: NextRequest,
  slug: string
): Promise<{ business: Business | null; customer: ShopCustomer | null; rec: Record<string, unknown> | null }> {
  const business = await getBusinessBySlug(slug);
  if (!business) return { business: null, customer: null, rec: null };
  const token = req.cookies.get(cookieName(slug))?.value;
  if (!token) return { business, customer: null, rec: null };
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.purpose !== "shop-customer" || payload.bid !== business.id || !payload.sub) {
      return { business, customer: null, rec: null };
    }
    const rec = await redis.hgetall<Record<string, unknown>>(`shopcust:${payload.sub}`);
    if (!rec || !rec.id || rec.businessId !== business.id) return { business, customer: null, rec: null };
    return { business, customer: toCustomer(rec), rec };
  } catch {
    return { business, customer: null, rec: null };
  }
}

export const emailNorm = (e: string) => e.trim().toLowerCase();
