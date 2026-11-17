import { redis } from "@/lib/upstash";
import { sendToUser } from "@/lib/push";
import { storeUserNotification } from "@/lib/notifications";
import { billingInfo } from "@/lib/user-billing";
import { isTrue } from "@/lib/password";
import { SUPER_ADMIN_EMAIL } from "@/lib/session";

// Notifications d'abonnement (en français) envoyées à l'utilisateur concerné.
export const REMINDER_DAYS = [3, 1]; // rappels envoyés 3 jours et 1 jour avant l'échéance

export function frDate(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Envoyée au moment où le compte principal marque l'abonnement comme payé. */
export async function notifyPaymentReceived(email: string, months: number, nextDue: string) {
  const body =
    `Votre paiement de ${months} mois a bien été reçu. Merci ! ` +
    `Prochaine échéance : ${frDate(nextDue)}.`;
  await storeUserNotification(email, "✅ Paiement reçu", body).catch((e) => console.error("billing inbox error", e));
  try {
    await sendToUser(email, { title: "✅ Paiement reçu", body, url: "/dashboard", tag: `billing-paid-${Date.now()}` });
  } catch (e) {
    console.error("billing push error", e);
  }
}

/** Rappels : l'échéance approche (J-3 et J-1). Une seule fois par échéance et par rappel. */
export async function sendDueSoonReminders(now: Date = new Date()) {
  const emails = await redis.smembers("users:all");
  const sent: string[] = [];
  for (const raw of emails) {
    const email = raw.toLowerCase();
    if (email === SUPER_ADMIN_EMAIL) continue;
    const r = await redis.hgetall<Record<string, unknown>>(`user:${email}`);
    if (!r || !r.id || isTrue(r.disabled)) continue;
    const paidMonths = r.paidMonths === undefined || r.paidMonths === null ? 1 : Number(r.paidMonths) || 0;
    const info = billingInfo(r.createdAt ? String(r.createdAt) : "", paidMonths, now);
    if (!info || info.monthsOverdue > 0 || !REMINDER_DAYS.includes(info.daysUntil)) continue;
    const days = info.daysUntil;

    // Anti-doublon : une seule notification par échéance.
    const ok = await redis.set(`billing:reminded:${email}:${info.nextDue}:${days}`, "1", { nx: true, ex: 60 * 60 * 24 * 10 });
    if (!ok) continue;

    const title = days === 1 ? "⚠️ Échéance demain" : "⏰ Échéance proche";
    const body =
      days === 1
        ? `Votre abonnement arrive à échéance demain (${frDate(info.nextDue)}). Pensez à effectuer votre paiement.`
        : `Votre abonnement arrive à échéance dans ${days} jours (${frDate(info.nextDue)}). Pensez à effectuer votre paiement.`;
    await storeUserNotification(email, title, body).catch((e) => console.error("billing inbox error", e));
    try {
      await sendToUser(email, { title, body, url: "/dashboard", tag: `billing-due-${info.nextDue}-${days}` });
      sent.push(email);
    } catch (e) {
      console.error("billing reminder error", e);
    }
  }
  return sent;
}
