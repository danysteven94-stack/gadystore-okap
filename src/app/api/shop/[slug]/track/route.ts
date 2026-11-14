import { NextRequest, NextResponse } from "next/server";
import { getBusinessBySlug, rateLimit, findOrderByCode } from "@/lib/shop";
import { PAY_LABEL, samePhone, type PayMethod } from "@/lib/shop-utils";

// GET ?code=ABC123&phone=509... — kliyan an swiv kòmand li (kòd + telefòn)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!(await rateLimit(req, "shop-track", 30, 3600))) {
    return NextResponse.json({ error: "Twòp tantativ. Eseye pita." }, { status: 429 });
  }
  const business = await getBusinessBySlug(slug);
  if (!business) return NextResponse.json({ error: "Boutik pa jwenn." }, { status: 404 });

  const code = req.nextUrl.searchParams.get("code") ?? "";
  const phone = req.nextUrl.searchParams.get("phone") ?? "";
  const order = await findOrderByCode(business.id, code);
  // Menm repons si kòmand lan pa egziste oswa telefòn nan pa matche
  if (!order || order.businessId !== business.id || !samePhone(String(order.customerPhone ?? ""), phone)) {
    return NextResponse.json({ error: "Pa jwenn kòmand. Verifye kòd la ak nimewo telefòn ou." }, { status: 404 });
  }

  return NextResponse.json(
    {
      order: {
        code: order.code,
        createdAt: order.createdAt,
        status: order.status,
        fulfillment: order.status === "cancelled" ? "cancelled" : order.fulfillment ?? "new",
        deliveryMethod: order.deliveryMethod ?? "delivery",
        paymentLabel: PAY_LABEL[(order.paymentMethod as PayMethod) ?? "cash_delivery"] ?? String(order.paymentMethod ?? ""),
        address: order.customerAddress ?? null,
        items: order.items ?? [],
        subtotal: Number(order.subtotal) || Number(order.totalAmount) || 0,
        deliveryFee: Number(order.deliveryFee) || 0,
        total: Number(order.totalAmount) || 0,
        paid: Number(order.depositAmount) || 0,
        balance: Number(order.balance) || 0,
        currency: business.currency || "HTG",
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
