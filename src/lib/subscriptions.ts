import { redis } from "@/lib/upstash";
import { userOwnsBusiness } from "@/lib/shop";
import { addMonthsYmd } from "@/lib/user-billing";
import type { Subscription } from "@/app/api/subscriptions/route";

/**
 * Abònman (streaming: Netflix, IPTV, Spotify...) ka viv:
 *  - anba yon antrepriz  → `business:{id}:subscriptions`
 *  - pèsonèl (san antrepriz) → `user:{email}:subscriptions`
 * Konsa pa gen obligasyon kreye yon antrepriz pou jere abònman streaming.
 */
export function scopeKey(businessId: string, email: string) {
  return businessId ? `business:${businessId}:subscriptions` : `user:${email.toLowerCase()}:subscriptions`;
}

export function parseIds(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  try {
    const v = JSON.parse(String(raw ?? "[]"));
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

/** Eske itilizatè sa a gen dwa sou abònman sa a? */
export async function canAccessSub(email: string, sub: Subscription): Promise<boolean> {
  if (sub.businessId) return userOwnsBusiness(email, String(sub.businessId));
  return String(sub.ownerEmail ?? "").toLowerCase() === email.toLowerCase();
}

/**
 * Konbyen mwa ki peye. Ansyen abònman yo pa gen `paymentsCount`:
 * nou dedui l ak dat kòmansman an ak pwochen dat peman an (omwen 1).
 */
export function paymentsOf(sub: Subscription): number {
  if (sub.paymentsCount !== undefined && sub.paymentsCount !== null && !isNaN(Number(sub.paymentsCount))) {
    return Math.max(0, Math.floor(Number(sub.paymentsCount)));
  }
  const start = String(sub.startDate).slice(0, 10);
  const next = String(sub.nextPaymentDate).slice(0, 10);
  let n = 0;
  while (n < 600 && addMonthsYmd(start, n) < next) n++;
  return Math.max(1, n);
}

export function nextPaymentFor(sub: Subscription, payments: number): string {
  return addMonthsYmd(String(sub.startDate).slice(0, 10), payments);
}
