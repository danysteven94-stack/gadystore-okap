import { redis } from "@/lib/upstash";
import { randomUUID } from "crypto";

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

export async function pushNotification(
  businessId: string,
  type: NotificationType,
  message: string
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
  return notif;
}

export async function notifyLowStock(businessId: string, productName: string) {
  return pushNotification(
    businessId,
    "low_stock",
    `Stok ${productName} bese anba minimòm nan.`
  );
}

export async function notifyNewSale(businessId: string, total: number) {
  return pushNotification(businessId, "new_sale", `Nouvo vant: ${total.toLocaleString("fr-FR")}.`);
}

export async function notifyLargeExpense(businessId: string, amount: number) {
  if (amount < LARGE_EXPENSE_THRESHOLD) return null;
  return pushNotification(
    businessId,
    "large_expense",
    `Depans enpòtan anrejistre: ${amount.toLocaleString("fr-FR")}.`
  );
}
