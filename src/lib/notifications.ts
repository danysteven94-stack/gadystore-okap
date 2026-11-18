import { redis } from "@/lib/upstash";
import { randomUUID } from "crypto";
import { sendPushToBusiness } from "@/lib/push";

export type NotificationType =
  | "low_stock"
  | "new_customer"
  | "new_sale"
  | "new_purchase"
  | "product_return"
  | "large_expense";

export interface AppNotification {
  [key: string]: unknown;
  id: string;
  businessId: string;
  type: NotificationType;
  message: string;
  read: boolean;
  createdAt: string;
}

const LARGE_EXPENSE_THRESHOLD = 20000; // seuil configurable (en devise locale)

function pushMeta(type: NotificationType, message: string) {
  if (type === "new_sale") {
    return message.startsWith("Nouvo kòmand")
      ? { title: "🛒 Nouvo kòmand", url: "/orders" }
      : { title: "💰 Nouvo vant", url: "/dashboard" };
  }
  if (type === "low_stock") return { title: "⚠️ Stok ba", url: "/products" };
  if (type === "large_expense") return { title: "💸 Depans enpòtan", url: "/expenses" };
  if (type === "product_return") return { title: "↩️ Retounen pwodwi", url: "/returns" };
  if (type === "new_purchase") return { title: "📦 Nouvo acha", url: "/dashboard" };
  return { title: "👤 Nouvo kliyan", url: "/contacts?kind=customer" };
}

export async function pushNotification(
  businessId: string,
  type: NotificationType,
  message: string,
  opts: { excludeEmail?: string } = {}
) {
  const notif: AppNotification = {
    id: randomUUID(),
    businessId,
    type,
    message,
    read: false,
    createdAt: new Date().toISOString(),
  };
  await redis.hset(`notification:${notif.id}`, notif as unknown as Record<string, unknown>);
  await redis.lpush(`business:${businessId}:notifications`, notif.id);
  await redis.ltrim(`business:${businessId}:notifications`, 0, 99); // garde les 100 dernières

  // Push sou telefòn/laptop (maks 4 s pou pa ralanti repons API a; erè pa kraze anyen)
  try {
    const meta = pushMeta(type, message);
    await Promise.race([
      sendPushToBusiness(businessId, { title: meta.title, body: message, url: meta.url, tag: notif.id }, opts),
      new Promise((resolve) => setTimeout(resolve, 4000)),
    ]);
  } catch (e) {
    console.error("push error", e);
  }
  return notif;
}

export async function notifyLowStock(businessId: string, productName: string) {
  return pushNotification(
    businessId,
    "low_stock",
    `Stok ${productName} bese anba minimòm nan.`
  );
}

export async function notifyNewSale(businessId: string, total: number, excludeEmail?: string) {
  return pushNotification(businessId, "new_sale", `Nouvo vant: ${total.toLocaleString("fr-FR")}.`, { excludeEmail });
}

export async function notifyLargeExpense(businessId: string, amount: number) {
  if (amount < LARGE_EXPENSE_THRESHOLD) return null;
  return pushNotification(
    businessId,
    "large_expense",
    `Depans enpòtan anrejistre: ${amount.toLocaleString("fr-FR")}.`
  );
}
