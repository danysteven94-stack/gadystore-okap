import { redis } from "@/lib/upstash";
import { getUserBusinessIds, userOwnsBusiness } from "@/lib/shop";
import { recordSubscriptionSale } from "@/lib/subscription-sale";
import type { Business } from "@/types";
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

/**
 * Ki antrepriz ki resevwa vant peman yo (pou dashboard/rapò):
 *  - abònman anba yon antrepriz → antrepriz sa a;
 *  - abònman pèsonèl → antrepriz "Streaming" itilizatè a (icon "streaming" oswa non ki gen stream/iptv/netflix),
 *    sinon premye antrepriz li a. "" = itilizatè a poko gen antrepriz (pa gen kote pou konte l).
 */
export async function salesBusinessFor(email: string, sub: Pick<Subscription, "businessId">): Promise<string> {
  if (sub.businessId) return String(sub.businessId);
  const ids = await getUserBusinessIds(email);
  if (!ids.length) return "";
  const rows = (await Promise.all(ids.map((id) => redis.hgetall<Business>(`business:${id}`)))).filter((b): b is Business => !!b && !!b.id);
  const pick =
    rows.find((b) => b.icon === "streaming") ??
    rows.find((b) => /stream|iptv|netflix/i.test(String(b.name))) ??
    rows[0];
  return pick ? String(pick.id) : "";
}

/**
 * Rattrapage: peman abònman pèsonèl ki fèt anvan (pa t konte nan dashboard) vin antre kòm vant.
 * Sèlman abònman pèsonèl; yon peman ki gen yon ID vant deja pa touche. Ranpli saleIds menm lòd ak paidDates.
 */
export async function backfillPersonalSales(email: string, subs: Subscription[], cashierId: string): Promise<void> {
  const personal = subs.filter((s) => !s.businessId && paymentsOf(s) > 0);
  if (!personal.length) return;
  const bizId = await salesBusinessFor(email, { businessId: "" });
  if (!bizId) return;

  for (const sub of personal) {
    const n = paymentsOf(sub);
    const saleIds = parseIds(sub.saleIds);
    const paidDates = parseIds(sub.paidDates);
    while (saleIds.length < n) saleIds.push("");
    const missing = saleIds.slice(0, n).map((id, i) => (id ? -1 : i)).filter((i) => i >= 0);
    if (!missing.length) continue;

    // Yon sèl sèvè nan yon lè pou chak abònman (evite doub vant si de demann rive ansanm)
    const got = await redis.set(`subsync:${sub.id}`, "1", { nx: true, ex: 30 });
    if (!got) continue;
    try {
      for (const i of missing) {
        const paidAt = paidDates[i] || `${addMonthsYmd(String(sub.startDate).slice(0, 10), i)}T12:00:00.000Z`;
        const sale = await recordSubscriptionSale({
          businessId: bizId,
          subscriptionId: sub.id,
          productName: sub.productName,
          amount: sub.monthlyPrice,
          customerId: sub.customerId,
          cashierId,
          paidAt,
          silent: true,
        });
        saleIds[i] = sale.id;
        if (!paidDates[i]) paidDates[i] = paidAt;
      }
      const patch = { saleIds: JSON.stringify(saleIds), paidDates: JSON.stringify(paidDates) };
      await redis.hset(`subscription:${sub.id}`, patch);
      sub.saleIds = patch.saleIds;
      sub.paidDates = patch.paidDates;
    } finally {
      await redis.del(`subsync:${sub.id}`);
    }
  }
}
