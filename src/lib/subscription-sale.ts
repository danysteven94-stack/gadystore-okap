import { randomUUID } from "crypto";
import { redis, hsetClean } from "@/lib/upstash";
import { notifyNewSale } from "@/lib/notifications";
import type { Sale } from "@/types";

interface RecordSubscriptionSaleArgs {
  businessId: string;
  subscriptionId: string;
  productName: string;
  amount: number;
  customerId?: string;
  cashierId: string;
}

/**
 * Kreye yon vant (Sale) pou yon peman abònman — konsa li antre nan
 * revni/rapò/dashboard yo tankou nenpòt lòt vant, olye pou l rete izole
 * nan sistèm abònman an sèlman.
 */
export async function recordSubscriptionSale({
  businessId,
  subscriptionId,
  productName,
  amount,
  customerId,
  cashierId,
}: RecordSubscriptionSaleArgs): Promise<Sale> {
  const sale: Sale = {
    id: randomUUID(),
    businessId,
    items: [
      {
        productId: subscriptionId,
        name: `Abònman — ${productName}`,
        qty: 1,
        unitPrice: amount,
      },
    ],
    subtotal: amount,
    discount: 0,
    tax: 0,
    total: amount,
    paymentMethod: "cash",
    customerId,
    cashierId,
    createdAt: new Date().toISOString(),
  };

  await hsetClean(`sale:${sale.id}`, sale as unknown as Record<string, unknown>);

  const today = sale.createdAt.slice(0, 10);
  await redis.lpush(`business:${businessId}:sales:${today}`, sale.id);

  await notifyNewSale(businessId, sale.total);

  return sale;
}

/**
 * Anile yon vant abònman (lè moun nan make yon peman pa erè):
 * retire l nan lis vant jou a epi efase l, konsa revni/rapò yo korije.
 */
export async function undoSubscriptionSale(saleId: string): Promise<boolean> {
  const sale = await redis.hgetall<Sale>(`sale:${saleId}`);
  if (!sale) return false;
  const day = String(sale.createdAt).slice(0, 10);
  await redis.lrem(`business:${sale.businessId}:sales:${day}`, 0, saleId);
  await redis.del(`sale:${saleId}`);
  return true;
}
