import { randomUUID } from "crypto";
import { redis, hsetClean } from "@/lib/upstash";
import { notifyNewSale } from "@/lib/notifications";
import type { Order } from "@/app/api/orders/route";
import type { Sale } from "@/types";

const PAY_MAP: Record<string, Sale["paymentMethod"]> = {
  cash_delivery: "cash",
  moncash: "mobile_money",
  natcash: "mobile_money",
  transfer: "card",
};

/**
 * Lè yon kòmand boutik an liy LIVRE e PEYE nèt, nou kreye yon vant (Sale) pou
 * kòb la antre nan revni / rapò / tablo de bò a tankou nenpòt lòt vant.
 *
 * - Stok la te deja rezève lè kliyan an te fè kòmand lan, kidonk nou pa retire l ankò.
 * - Yon kòmand pa janm konte de fwa (kle `ordersale:{id}` + chan `saleId` sou kòmand lan).
 * - Ka rele plizyè fwa san danje: li pa fè anyen si kondisyon yo poko ranpli.
 */
export async function recordOrderSaleIfReady(
  orderId: string,
  cashierId: string,
  actorEmail?: string
): Promise<Sale | null> {
  const order = await redis.hgetall<Order>(`order:${orderId}`);
  if (!order || order.source !== "shop") return null;
  if (String(order.status) !== "paid" || String(order.fulfillment) !== "delivered") return null;
  if (order.saleId) return null;

  // Anpeche doub antre si de rekèt rive an menm tan
  const got = await redis.set(`ordersale:${orderId}`, "1", { nx: true });
  if (!got) return null;

  const items = (Array.isArray(order.items) ? order.items : []).map((it) => ({
    productId: String(it.productId),
    name: String(it.name) + (it.variant ? ` (${it.variant})` : ""),
    qty: Number(it.qty) || 0,
    unitPrice: Number(it.unitPrice) || 0,
  }));

  const total = Number(order.totalAmount) || 0;
  const sale: Sale = {
    id: randomUUID(),
    businessId: String(order.businessId),
    items,
    subtotal: Number(order.subtotal) || total,
    discount: Number(order.discount) || 0,
    tax: 0,
    total,
    paymentMethod: PAY_MAP[String(order.paymentMethod)] ?? "cash",
    cashierId,
    createdAt: new Date().toISOString(),
    source: "shop",
    orderId,
    orderCode: order.code !== undefined ? String(order.code) : undefined,
    shipping: Number(order.shippingFee) || 0,
  };

  await hsetClean(`sale:${sale.id}`, sale as unknown as Record<string, unknown>);
  await redis.lpush(`business:${sale.businessId}:sales:${sale.createdAt.slice(0, 10)}`, sale.id);
  await redis.hset(`order:${orderId}`, { saleId: sale.id });
  await notifyNewSale(sale.businessId, sale.total, actorEmail);
  return sale;
}
