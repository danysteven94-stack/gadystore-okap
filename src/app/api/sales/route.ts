import { NextRequest, NextResponse } from "next/server";
import { userOwnsBusiness } from "@/lib/shop";
import { withIdempotency } from "@/lib/idempotency";
import { z } from "zod";
import { randomUUID } from "crypto";
import { redis, hsetClean, hgetallMany } from "@/lib/upstash";
import { releaseStock, reserveStock, type StockLine } from "@/lib/stock";
import { pricesMatch } from "@/lib/permissions";
import { verifySession, can } from "@/lib/auth";
import { notifyLowStock, notifyNewSale } from "@/lib/notifications";
import type { Product, Sale } from "@/types";

const saleSchema = z.object({
  businessId: z.string(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        name: z.string(),
        qty: z.number().int().positive().max(100000),
        unitPrice: z.number().nonnegative(),
      })
    )
    .min(1),
  discount: z.number().nonnegative().default(0),
  taxRate: z.number().nonnegative().default(0), // pourcentage
  paymentMethod: z.enum(["cash", "card", "mobile_money", "mixed"]),
  customerId: z.string().optional(),
  createdAt: z.string().datetime().optional(), // vant fèt offline
});

async function postHandler(req: NextRequest) {
  try {
    const token = req.cookies.get("session")?.value;
    const session = token ? await verifySession(token) : null;
    if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });
    if (!can(session.role, "sales:write")) {
      return NextResponse.json({ error: "Aksè refize." }, { status: 403 });
    }

    const body = await req.json();
    const parsed = saleSchema.safeParse(body);
  if (parsed.success && !(await userOwnsBusiness(session.email, parsed.data.businessId))) {
    return NextResponse.json({ error: "Aksè refize." }, { status: 403 });
  }
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { businessId, items, discount, taxRate, paymentMethod, customerId } =
      parsed.data;
    // Dat vant offline: aksepte sèlman si pa nan lavni epi mwens pase 30 jou
    const claimed = parsed.data.createdAt ? Date.parse(parsed.data.createdAt) : NaN;
    const createdAt =
      !Number.isNaN(claimed) && claimed <= Date.now() + 60_000 && Date.now() - claimed < 30 * 86400_000
        ? new Date(claimed).toISOString()
        : new Date().toISOString();

    // Chak pwodwi dwe pou biznis sa a (pa ka vann/debite pwodwi yon lòt biznis).
    const productIds = [...new Set(items.map((i) => i.productId))];
    const ownPipe = redis.pipeline();
    for (const id of productIds) ownPipe.sismember(`business:${businessId}:products`, id);
    const owned = (await ownPipe.exec()) as number[];
    const products = await hgetallMany<Product>(productIds.map((id) => `product:${id}`));
    const productById = new Map<string, Product>();
    for (let k = 0; k < productIds.length; k++) {
      const p = products[k];
      if (!owned[k] || !p) {
        const name = items.find((i) => i.productId === productIds[k])?.name ?? productIds[k];
        return NextResponse.json({ error: `Pwodwi ${name} pa jwenn.` }, { status: 404 });
      }
      productById.set(productIds[k], p);
    }

    // Pri ak non soti nan baz la, pa nan kliyan an (yon kesye pa ka voye yon pri 0 oswa yon lòt non).
    // Si pri a chanje depi POS la te chaje, nou refize pou kliyan an pa peye yon lòt pri ke sa l te wè.
    for (const it of items) {
      const p = productById.get(it.productId)!;
      if (!pricesMatch(it.unitPrice, Number(p.sellPrice))) {
        return NextResponse.json(
          { error: `Pri ${p.name} chanje (kounye a ${p.sellPrice}). Rafrechi lis pwodwi yo epi eseye ankò.` },
          { status: 409 }
        );
      }
      it.unitPrice = Number(p.sellPrice);
      it.name = p.name;
    }

    const subtotal = items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0);
    if (discount > subtotal) {
      return NextResponse.json({ error: "Rabè a pa ka pi gwo pase sou-total la." }, { status: 400 });
    }
    const afterDiscount = subtotal - discount;
    const tax = (afterDiscount * taxRate) / 100;
    const total = afterDiscount + tax;

    // Rezève stok la ATOMIKMAN (digital/dish pa gen stok). Si pa sifi → 409, anyen pa debite.
    const tracked: StockLine[] = items
      .filter((i) => !["digital", "dish"].includes(String(productById.get(i.productId)?.productType)))
      .map((i) => ({ productId: i.productId, qty: i.qty }));
    const reservation = await reserveStock(redis, tracked);
    if (!reservation.ok) {
      const name = items.find((i) => i.productId === reservation.productId)?.name ?? reservation.productId;
      return NextResponse.json(
        { error: `Stok ${name} pa sifi (${Math.max(reservation.available, 0)} rete).` },
        { status: 409 }
      );
    }

    const sale: Sale = {
      id: randomUUID(),
      businessId,
      items,
      subtotal,
      discount,
      tax,
      total,
      paymentMethod,
      customerId,
      cashierId: session.userId,
      createdAt,
    };

    try {
      await hsetClean(`sale:${sale.id}`, sale as unknown as Record<string, unknown>);
      const today = sale.createdAt.slice(0, 10); // YYYY-MM-DD
      await redis.lpush(`business:${businessId}:sales:${today}`, sale.id);
    } catch (err) {
      // Vant la pa anrejistre: remèt stok la pou pa pèdi mache.
      await releaseStock(redis, tracked).catch(() => {});
      throw err;
    }

    // Alèt stok fèb
    for (const [productId, left] of Object.entries(reservation.left)) {
      const pr = productById.get(productId);
      if (pr && left <= pr.minStock) {
        await notifyLowStock(businessId, items.find((i) => i.productId === productId)?.name ?? productId);
      }
    }

    await notifyNewSale(businessId, sale.total, session.email);

    return NextResponse.json({ sale }, { status: 201 });
  } catch (err) {
    console.error("sales error", err);
    return NextResponse.json({ error: "Erè sèvè." }, { status: 500 });
  }
}

export const POST = withIdempotency("sales", postHandler);
