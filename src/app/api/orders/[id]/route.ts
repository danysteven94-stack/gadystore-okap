import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/upstash";
import { getSessionFromReq, userOwnsBusiness } from "@/lib/shop";
import type { Order } from "@/app/api/orders/route";

const FULFILLMENT = ["new", "confirmed", "preparing", "shipped", "delivered"] as const;

// PATCH { action: "cancel" } — anile yon kòmand epi remèt stok la si se yon kòmand boutik.
// PATCH { action: "fulfillment", fulfillment, note? } — chanje etap livrezon kòmand boutik la (kliyan an wè l nan swivi).
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromReq(req);
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });

  const { id } = await params;
  const order = await redis.hgetall<Order>(`order:${id}`);
  if (!order) return NextResponse.json({ error: "Kòmand pa jwenn." }, { status: 404 });
  if (!(await userOwnsBusiness(session.email, order.businessId))) {
    return NextResponse.json({ error: "Aksè refize." }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));

  if (body.action === "fulfillment") {
    if (order.source !== "shop") return NextResponse.json({ error: "Sèlman pou kòmand boutik." }, { status: 400 });
    if (order.status === "cancelled") return NextResponse.json({ error: "Kòmand sa a anile." }, { status: 409 });
    if (!(FULFILLMENT as readonly string[]).includes(body.fulfillment)) {
      return NextResponse.json({ error: "Etap envalid." }, { status: 400 });
    }
    const note = typeof body.note === "string" ? body.note.trim().slice(0, 200) : "";
    await redis.hset(`order:${id}`, { fulfillment: body.fulfillment, fulfillmentNote: note });
    return NextResponse.json({ order: { ...order, fulfillment: body.fulfillment, fulfillmentNote: note } });
  }

  if (body.action !== "cancel") return NextResponse.json({ error: "Aksyon envalid." }, { status: 400 });
  if (order.status === "cancelled") return NextResponse.json({ order });

  if (order.source === "shop" && Array.isArray(order.items)) {
    for (const it of order.items) {
      const exists = await redis.exists(`product:${it.productId}`);
      if (exists) {
        await redis.hincrby(`product:${it.productId}`, "stock", it.qty);
        await redis.hincrby(`product:${it.productId}`, "sold", -it.qty);
      }
    }
  }
  await redis.hset(`order:${id}`, { status: "cancelled", fulfillment: "cancelled" });
  return NextResponse.json({ order: { ...order, status: "cancelled", fulfillment: "cancelled" } });
}
