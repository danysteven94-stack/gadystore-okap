import { redis } from "@/lib/upstash";
import { sendToUser } from "@/lib/push";
import { pushNotification } from "@/lib/notifications";
import { ymd, daysBetween } from "@/lib/user-billing";
import type { Subscription } from "@/app/api/subscriptions/route";

/**
 * Rapèl abònman kliyan yo (Netflix, IPTV...) voye bay PWOPRIYETÈ a:
 *  - 1 jou anvan dat peman an  → "Demen ... dwe peye" (tan pou voye yon mesaj kliyan an)
 *  - jou dat peman an rive     → "Jodi a ... dwe peye"
 * Yon sèl notifikasyon pa abònman, pa dat, pa rapèl (anti-doublon Redis NX).
 */
export const SUB_REMINDER_DAYS = [1, 0];

function money(n: number) {
  return `${Number(n).toLocaleString("fr-FR")} G`;
}

function who(s: Subscription) {
  return `${s.customerName} — ${s.productName}${s.profile ? ` (${s.profile})` : ""}`;
}

async function allSubscriptionIds(): Promise<string[]> {
  const ids = new Set<string>();
  const [businessIds, emails] = await Promise.all([
    redis.smembers("businesses:all"),
    redis.smembers("users:all"),
  ]);
  const lists = await Promise.all([
    ...businessIds.map((id) => redis.smembers(`business:${id}:subscriptions`)),
    ...emails.map((e) => redis.smembers(`user:${String(e).toLowerCase()}:subscriptions`)),
  ]);
  for (const l of lists) for (const id of l) ids.add(String(id));
  return [...ids];
}

export async function sendSubscriptionReminders(now: Date = new Date()) {
  const today = ymd(now);
  const sent: string[] = [];
  const ids = await allSubscriptionIds();

  for (const id of ids) {
    const s = await redis.hgetall<Subscription>(`subscription:${id}`);
    if (!s || !s.id || s.status === "cancelled") continue;
    const next = String(s.nextPaymentDate ?? "").slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(next)) continue;
    const days = daysBetween(today, next);
    if (!SUB_REMINDER_DAYS.includes(days)) continue;

    const ok = await redis.set(`subreminded:${id}:${next}:${days}`, "1", { nx: true, ex: 60 * 60 * 24 * 10 });
    if (!ok) continue;

    const message =
      days === 1
        ? `Demen ${who(s)} dwe peye ${money(s.monthlyPrice)}. Voye yon rapèl bay moun nan.`
        : `Jodi a ${who(s)} dwe peye ${money(s.monthlyPrice)}.`;

    try {
      if (s.businessId) {
        await pushNotification(String(s.businessId), "subscription_due", message);
      } else if (s.ownerEmail) {
        await sendToUser(String(s.ownerEmail), {
          title: "⏰ Abònman ap rive nan dat",
          body: message,
          url: "/subscriptions",
          tag: `sub-due-${id}-${next}-${days}`,
        });
      }
      sent.push(id);
    } catch (e) {
      console.error("subscription reminder error", e);
    }
  }
  return sent;
}
