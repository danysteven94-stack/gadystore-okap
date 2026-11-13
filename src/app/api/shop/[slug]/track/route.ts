import { NextRequest, NextResponse } from "next/server";
import { getBusinessBySlug, rateLimit, findOrderByCode, samePhone, toNum } from "@/lib/shop";

const PAY_LABEL: Record<string, string> = {
  cash_delivery: "Kach lè livrezon/ranmase",
  moncash: "MonCash",
  natcash: "NatCash",
  transfer: "Transfè bank",
};

// GET ?code=ABC123&phone=509... — kliyan an swiv kòmand li. Kòd + telefòn MWEN tou de matche.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!(await rateLimit(req, "shop-track", 40, 3600))) {
    return NextResponse.json({ error: "Twòp demann. Eseye pita." }, { status: 429 });
  }
  const business = await getBusinessBySlug(slug);
  if (!business) return NextResponse.json({ error: "Boutik pa jwenn." }, { status: 404 });

  const code = req.nextUrl.searchParams.get("code") ?? "";
  const phone = req.nextUrl.searchParams.get("phone") ?? "";
  const order = await findOrderByCode(business.id, code);
  // Menm mesaj si kòd la move oswa telefòn nan pa matche (pa bay enfòmasyon bay moun k ap devine)
  if (!order || order.source !== "shop" || !samePhone(String(order.customerPhone ?? ""), phone)) {
    return NextResponse.json({ error: "Nou pa jwenn kòmand sa a. Verifye kòd la ak telefòn nan." }, { status: 404 });
  }

  const status = String(order.status);
  const fulfillment = status === "cancelled" ? "cancelled" : String(order.fulfillment || "new");
  const items = Array.isArray(order.items) ? (order.items as Record<string, unknown>[]) : [];

  return NextResponse.json(
    {
      order: {
        code: String(order.code),
        createdAt: String(order.createdAt),
        status,
        fulfillment,
        fulfillmentNote: order.fulfillmentNote ? String(order.fulfillmentNote) : null,
        deliveryMethod: order.deliveryMethod === "pickup" ? "pickup" : "delivery",
        paymentLabel: PAY_LABEL[String(order.paymentMethod)] ?? String(order.paymentMethod ?? ""),
        paymentMethod: String(order.paymentMethod ?? ""),
        customerName: String(order.customerName ?? ""),
        items: items.map((i) => ({
          productId: String(i.productId),
          name: String(i.name),
          qty: toNum(i.qty),
          unitPrice: toNum(i.unitPrice),
          unit: i.unit ? String(i.unit) : "",
        })),
        subtotal: toNum(order.subtotal, toNum(order.totalAmount)),
        discount: toNum(order.discount),
        shipping: toNum(order.shippingFee),
        total: toNum(order.totalAmount),
        paid: toNum(order.depositAmount),
        balance: toNum(order.balance),
        currency: business.currency || "HTG",
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
