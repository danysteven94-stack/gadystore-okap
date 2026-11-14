import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID, randomBytes } from "crypto";
import { redis, hsetClean } from "@/lib/upstash";
import { getBusinessBySlug, rateLimit, cleanPhone, priceCart, normCode } from "@/lib/shop";
import { pushNotification, notifyLowStock } from "@/lib/notifications";
import { sendOrderMessages } from "@/lib/order-messages";
import { getShopCustomer } from "@/lib/shop-customer";
import type { Order } from "@/app/api/orders/route";
import type { Product } from "@/types";

const schema = z.object({
  customerName: z.string().trim().min(2).max(80),
  phone: z.string().min(7).max(20),
  email: z.union([z.string().trim().email().max(120), z.literal("")]).optional(),
  address: z.string().trim().max(200).optional(),
  note: z.string().trim().max(300).optional(),
  paymentMethod: z.enum(["cash_delivery", "moncash", "natcash", "transfer"]),
  paymentRef: z.string().trim().max(60).optional(),
  deliveryMethod: z.enum(["delivery", "pickup"]).default("delivery"),
  couponCode: z.string().max(30).optional(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        qty: z.number().int().positive().max(9999),
        size: z.string().trim().max(40).optional(),
        color: z.string().trim().max(40).optional(),
      })
    )
    .min(1)
    .max(50),
});

const PAY_LABEL: Record<string, string> = {
  cash_delivery: "Kach lè livrezon/ranmase",
  moncash: "MonCash",
  natcash: "NatCash",
  transfer: "Transfè bank",
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!(await rateLimit(req, "shop-order", 8, 3600))) {
    return NextResponse.json({ error: "Twòp kòmand nan yon ti tan. Eseye pita." }, { status: 429 });
  }

  const business = await getBusinessBySlug(slug);
  if (!business) return NextResponse.json({ error: "Boutik pa jwenn." }, { status: 404 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Ranpli non ou, nimewo telefòn ou ak omwen yon pwodwi." }, { status: 400 });
  }
  const { customerName, address, note, paymentMethod, paymentRef, deliveryMethod, couponCode } = parsed.data;
  const phone = cleanPhone(parsed.data.phone);

  if (deliveryMethod === "delivery" && (!address || address.length < 5)) {
    return NextResponse.json({ error: "Mete adrès livrezon ou." }, { status: 400 });
  }

  // Pri, rabè ak livrezon KALKILE SÈVÈ A — jamè navigatè kliyan an
  const priced = await priceCart(business, parsed.data.items, deliveryMethod, couponCode);
  if (!priced.ok) return NextResponse.json({ error: priced.error }, { status: priced.status });
  if (couponCode && normCode(couponCode) && priced.couponError) {
    return NextResponse.json({ error: priced.couponError }, { status: 400 });
  }
  const { lines, subtotal, discount, shipping, total } = priced;

  // Rezève stok la atomikman (hincrby): si yon liy pa sifi, anile sa nou te deja rezève
  const reserved: { productId: string; qty: number }[] = [];
  for (const l of lines) {
    if (l.digital) continue; // pwodwi online: pa gen stok pou rezève
    const left = await redis.hincrby(`product:${l.productId}`, "stock", -l.qty);
    if (left < 0) {
      await redis.hincrby(`product:${l.productId}`, "stock", l.qty);
      for (const r of reserved) await redis.hincrby(`product:${r.productId}`, "stock", r.qty);
      return NextResponse.json(
        { error: `Stok ${l.name} pa sifi. Redwi kantite a oswa rafrechi paj la.` },
        { status: 409 }
      );
    }
    reserved.push({ productId: l.productId, qty: l.qty });
    const prod = await redis.hgetall<Product>(`product:${l.productId}`);
    if (prod && left <= Number(prod.minStock)) await notifyLowStock(business.id, l.name);
  }

  // Si kliyan an konekte, nou lye kòmand lan ak kont li
  const { customer: acct } = await getShopCustomer(req, slug);

  const id = randomUUID();
  // Kòd kout inik (endèks pou swivi kòmand lan)
  let code = id.slice(0, 6).toUpperCase();
  for (let i = 0; i < 6; i++) {
    const ok = await redis.set(`shop:ordercode:${business.id}:${code}`, id, { nx: true });
    if (ok) break;
    code = randomBytes(3).toString("hex").toUpperCase();
  }

  const description = lines.map((l) => `${l.qty}× ${l.name}${l.variant ? ` (${l.variant})` : ""}`).join(", ");

  const order: Order = {
    id,
    businessId: business.id,
    customerName,
    description,
    totalAmount: total,
    depositAmount: 0,
    balance: total,
    status: "pending",
    createdAt: new Date().toISOString(),
    source: "shop",
    code,
    customerPhone: phone,
    customerEmail: (parsed.data.email || acct?.email || "").toLowerCase() || undefined,
    customerAddress: deliveryMethod === "delivery" ? address : undefined,
    note,
    paymentMethod,
    paymentRef: paymentRef || undefined,
    deliveryMethod,
    fulfillment: "new",
    subtotal,
    discount,
    shippingFee: shipping,
    couponCode: priced.couponCode ?? undefined,
    items: lines,
    shopCustomerId: acct?.id,
  };

  await hsetClean(`order:${id}`, order as unknown as Record<string, unknown>);
  await redis.lpush(`business:${business.id}:orders`, id);
  if (acct) await redis.lpush(`shopcust:${acct.id}:orders`, id);

  // Estatistik: pi vann yo + itilizasyon koupon
  await Promise.all([
    ...lines.map((l) => redis.hincrby(`product:${l.productId}`, "sold", l.qty)),
    priced.couponCode ? redis.hincrby(`coupon:${business.id}:${priced.couponCode}`, "uses", 1) : Promise.resolve(0),
  ]);

  await pushNotification(
    business.id,
    "new_sale",
    `Nouvo kòmand sou entènèt #${code} — ${customerName} (${phone}): ${total.toLocaleString("fr-FR")} ${business.currency} · ${
      deliveryMethod === "pickup" ? "ranmase" : "livrezon"
    }.`
  );

  // Mesaj otomatik pou kliyan an (imèl + WhatsApp) — maks 6 s, erè pa kraze kòmand lan
  await Promise.race([sendOrderMessages("placed", id), new Promise((r) => setTimeout(r, 6000))]);

  return NextResponse.json(
    {
      order: {
        id,
        code,
        subtotal,
        discount,
        shipping,
        total,
        currency: business.currency,
        paymentLabel: PAY_LABEL[paymentMethod],
        deliveryMethod,
        lines,
      },
    },
    { status: 201 }
  );
}
