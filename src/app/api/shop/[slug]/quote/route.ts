import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getBusinessBySlug, rateLimit, priceCart } from "@/lib/shop";

const schema = z.object({
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

// POST — devi: total, frè livrezon ak verifikasyon stok, san kreye kòmand.
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
  if (!parsed.success) return NextResponse.json({ error: "Panye a pa valid." }, { status: 400 });

  const priced = await priceCart(business, parsed.data.items, parsed.data.deliveryMethod);
  if (!priced.ok) return NextResponse.json({ error: priced.error }, { status: priced.status });

  return NextResponse.json(
    {
      quote: {
        lines: priced.lines,
        subtotal: priced.subtotal,
        deliveryFee: priced.deliveryFee,
        total: priced.total,
        currency: business.currency || "HTG",
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
