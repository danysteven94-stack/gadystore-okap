import { redis } from "@/lib/upstash";
import type { Order } from "@/app/api/orders/route";
import type { Business, Customer, Sale } from "@/types";
import type { InvoiceKind } from "@/lib/invoice-token";

export interface InvoiceData {
  business: Business;
  sale: Sale;
  customer?: Customer;
  invoiceNumber: string;
  businessId: string;
  phone: string;
  extra?: { paid?: number; balance?: number; reference?: string };
}

/** Chaje done fakti a pou yon vant (POS / vant boutik) oswa pou yon kòmand. */
export async function loadInvoice(kind: InvoiceKind, id: string): Promise<InvoiceData | null> {
  if (kind === "sale") {
    const sale = await redis.hgetall<Sale>(`sale:${id}`);
    if (!sale) return null;
    const business = await redis.hgetall<Business>(`business:${sale.businessId}`);
    if (!business) return null;
    let customer: Customer | undefined = sale.customerId
      ? ((await redis.hgetall<Customer>(`customer:${sale.customerId}`)) ?? undefined)
      : undefined;
    let phone = customer?.phone ?? "";
    // Vant ki soti nan yon kòmand boutik: pran kliyan an sou kòmand lan
    if (!customer && sale.orderId) {
      const o = await redis.hgetall<Order>(`order:${sale.orderId}`);
      if (o) {
        customer = { id: "", businessId: o.businessId, name: String(o.customerName), phone: o.customerPhone, address: o.customerAddress } as Customer;
        phone = String(o.customerPhone ?? "");
      }
    }
    const ref = sale.orderCode ? `Kòmand #${sale.orderCode}` : undefined;
    return {
      business, sale, customer, phone, businessId: sale.businessId,
      invoiceNumber: sale.orderCode ? `K${sale.orderCode}` : sale.id.slice(0, 8).toUpperCase(),
      extra: ref ? { reference: ref } : undefined,
    };
  }

  const order = await redis.hgetall<Order>(`order:${id}`);
  if (!order) return null;
  const business = await redis.hgetall<Business>(`business:${order.businessId}`);
  if (!business) return null;

  const total = Number(order.totalAmount) || 0;
  let items = (Array.isArray(order.items) ? order.items : []).map((it) => ({
    productId: String(it.productId),
    name: String(it.name) + (it.variant ? ` (${it.variant})` : ""),
    qty: Number(it.qty) || 0,
    unitPrice: Number(it.unitPrice) || 0,
  }));
  // Kòmand manyèl san lis pwodwi: yon sèl liy ak deskripsyon an
  if (items.length === 0) items = [{ productId: order.id, name: String(order.description || "Kòmand"), qty: 1, unitPrice: total }];

  const shipping = Number(order.shippingFee) || 0;
  const discount = Number(order.discount) || 0;
  const subtotal = Number(order.subtotal) || items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const sale = {
    id: order.id,
    businessId: String(order.businessId),
    items,
    subtotal,
    discount,
    tax: 0,
    total,
    paymentMethod: "cash",
    cashierId: "",
    createdAt: String(order.createdAt),
    shipping,
  } as Sale;

  const customer = {
    id: "", businessId: String(order.businessId), name: String(order.customerName),
    phone: order.customerPhone, address: order.customerAddress,
  } as Customer;

  return {
    business, sale, customer, phone: String(order.customerPhone ?? ""), businessId: String(order.businessId),
    invoiceNumber: order.code !== undefined ? `K${order.code}` : order.id.slice(0, 8).toUpperCase(),
    extra: { paid: Number(order.depositAmount) || 0, balance: Number(order.balance) || 0, reference: order.code !== undefined ? `Kòmand #${order.code}` : undefined },
  };
}
