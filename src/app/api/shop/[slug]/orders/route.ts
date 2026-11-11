import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { redis, hsetClean } from "@/lib/upstash";
import { getBusinessBySlug, rateLimit, cleanPhone, isTrue } from "@/lib/shop";
import { pushNotification, notifyLowStock } from "@/lib/notifications";
import type { Order } from "@/app/api/orders/route";
import type { Product } from "@/types";

const schema = z.object({
  customerName: z.string().trim().min(2).max(80),
  phone: z.string().min(7).max(20),
  address: z.string().trim().max(200).optional(),
  note: z.string().trim().max(300).optional(),
  paymentMethod: z.enum(["cash_delivery", "moncash", "natcash", "transfer"]),
  items: z
    .array(z.object({ productId: z.string(), qty: z.number().int().positive().max(9999) }))
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
  const { customerName, address, note, paymentMethod } = parsed.data;
  const phone = cleanPhone(parsed.data.phone);

  // Konbine liy repete
  const wanted = new Map<string, number>();
  for (const it of parsed.data.items) wanted.set(it.productId, (wanted.get(it.productId) ?? 0) + it.qty);

  // Pri yo ALWAYS soti nan baz done a, jamè nan navigatè kliyan an
  const lines: { productId: string; name: string; qty: number; unitPrice: number; unit: string }[] = [];
  for (const [productId, qty] of wanted) {
    const p = await redis.hgetall<Product>(`product:${productId}`);
    if (!p || p.businessId !== business.id || !isTrue(p.published)) {
      return NextResponse.json({ error: "Yon pwodwi pa disponib ankò. Rafrechi paj la." }, { status: 404 });
    }
    lines.push({ productId, name: p.name, qty, unitPrice: Number(p.sellPrice) || 0, unit: (p.unit as string) || "" });
  }

  const total = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
  if (total <= 0) {
    return NextResponse.json({ error: "Pwodwi sa yo pa gen pri. Kontakte biznis la." }, { status: 400 });
  }

  // Rezève stok la atomikman (hincrby): si yon liy pa sifi, anile sa nou te deja rezève
  const reserved: { productId: string; qty: number }[] = [];
  for (const l of lines) {
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

  const id = randomUUID();
  const code = id.slice(0, 6).toUpperCase();
  const description = lines.map((l) => `${l.qty}× ${l.name}`).join(", ");

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
    customerAddress: address,
    note,
    paymentMethod,
    items: lines,
  };

  await hsetClean(`order:${id}`, order as unknown as Record<string, unknown>);
  await redis.lpush(`business:${business.id}:orders`, id);
  await pushNotification(
    business.id,
    "new_sale",
    `Nouvo kòmand sou entènèt #${code} — ${customerName} (${phone}): ${total.toLocaleString("fr-FR")} ${business.currency}.`
  );

  return NextResponse.json(
    {
      order: {
        id,
        code,
        total,
        currency: business.currency,
        paymentLabel: PAY_LABEL[paymentMethod],
        lines,
      },
    },
    { status: 201 }
  );
}
