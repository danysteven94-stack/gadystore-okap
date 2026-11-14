import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID, randomInt } from "crypto";
import { redis, hsetClean } from "@/lib/upstash";
import { getBusinessBySlug, rateLimit, cleanPhone, isTrue, priceCart } from "@/lib/shop";
import { PAY_LABEL } from "@/lib/shop-utils";
import { pushNotification, notifyLowStock } from "@/lib/notifications";
import type { Order } from "@/app/api/orders/route";

const schema = z.object({
  customerName: z.string().trim().min(2).max(80),
  phone: z.string().min(7).max(20),
  address: z.string().trim().max(200).optional(),
  note: z.string().trim().max(300).optional(),
  paymentMethod: z.enum(["cash_delivery", "moncash", "natcash", "transfer"]),
  deliveryMethod: z.enum(["delivery", "pickup"]).default("delivery"),
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

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function newCode() {
  let c = "";
  for (let i = 0; i < 6; i++) c += CODE_CHARS[randomInt(CODE_CHARS.length)];
  return c;
}

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
  const { customerName, address, note, paymentMethod, deliveryMethod } = parsed.data;
  const phone = cleanPhone(parsed.data.phone);

  if (deliveryMethod === "pickup" && !isTrue(business.shopPickup)) {
    return NextResponse.json({ error: "Boutik la pa ofri ranmase sou plas." }, { status: 400 });
  }
  if (deliveryMethod === "delivery" && (!address || address.length < 5)) {
    return NextResponse.json({ error: "Antre adrès livrezon an." }, { status: 400 });
  }

  const priced = await priceCart(business, parsed.data.items, deliveryMethod);
  if (!priced.ok) return NextResponse.json({ error: priced.error }, { status: priced.status });
  const { lines, subtotal, deliveryFee, total } = priced;
  const prodCache = priced.products;

  // Rezève stok la atomikman (hincrby) pa pwodwi: si yon pwodwi pa sifi, anile sa nou te deja rezève
  const perProduct = new Map<string, number>();
  for (const l of lines) perProduct.set(l.productId, (perProduct.get(l.productId) ?? 0) + l.qty);
  const reserved: { productId: string; qty: number }[] = [];
  for (const [productId, qty] of perProduct) {
    const p = prodCache.get(productId)!;
    const left = await redis.hincrby(`product:${productId}`, "stock", -qty);
    if (left < 0) {
      await redis.hincrby(`product:${productId}`, "stock", qty);
      for (const r of reserved) await redis.hincrby(`product:${r.productId}`, "stock", r.qty);
      return NextResponse.json(
        { error: `Stok ${p.name} pa sifi. Redwi kantite a oswa rafrechi paj la.` },
        { status: 409 }
      );
    }
    reserved.push({ productId, qty });
    if (left <= Number(p.minStock)) await notifyLowStock(business.id, String(p.name));
  }

  // Kòd kòmand kout (6 karaktè) ki inik pou biznis la
  const id = randomUUID();
  let code = newCode();
  for (let i = 0; i < 6; i++) {
    const ok = await redis.set(`ordercode:${business.id}:${code}`, id, { nx: true });
    if (ok) break;
    code = newCode();
  }

  const description = lines
    .map((l) => `${l.qty}× ${l.name}${l.variant ? ` (${l.variant})` : ""}`)
    .join(", ");

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
    customerAddress: deliveryMethod === "pickup" ? undefined : address,
    note,
    paymentMethod,
    items: lines,
    subtotal,
    deliveryFee,
    deliveryMethod,
    fulfillment: "new",
  };

  await hsetClean(`order:${id}`, order as unknown as Record<string, unknown>);
  await redis.lpush(`business:${business.id}:orders`, id);
  await pushNotification(
    business.id,
    "new_sale",
    `Nouvo kòmand sou entènèt #${code} — ${customerName} (${phone}): ${total.toLocaleString("fr-FR")} ${business.currency}${
      deliveryMethod === "pickup" ? " · ranmase sou plas" : ""
    }.`
  );

  return NextResponse.json(
    {
      order: {
        id,
        code,
        subtotal,
        deliveryFee,
        deliveryMethod,
        total,
        currency: business.currency,
        paymentLabel: PAY_LABEL[paymentMethod],
        lines,
      },
    },
    { status: 201 }
  );
}
