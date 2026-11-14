import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getBusinessBySlug, rateLimit, priceCart } from "@/lib/shop";

const schema = z.object({
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

// Kalkile total la (rabè + livrezon) — sèvè a se sous verite a, menm kalkil ak kòmand lan.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!(await rateLimit(req, "shop-quote", 120, 3600))) {
    return NextResponse.json({ error: "Twòp demann. Eseye pita." }, { status: 429 });
  }
  const business = await getBusinessBySlug(slug);
  if (!business) return NextResponse.json({ error: "Boutik pa jwenn." }, { status: 404 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Done pa valid." }, { status: 400 });

  const r = await priceCart(business, parsed.data.items, parsed.data.deliveryMethod, parsed.data.couponCode);
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });

  return NextResponse.json({
    subtotal: r.subtotal,
    discount: r.discount,
    shipping: r.shipping,
    total: r.total,
    freeShipping: r.freeShipping,
    couponCode: r.couponCode,
    couponError: r.couponError,
  });
}
