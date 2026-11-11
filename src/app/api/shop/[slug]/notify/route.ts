import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { redis } from "@/lib/upstash";
import { getBusinessBySlug, rateLimit, cleanPhone } from "@/lib/shop";
import { pushNotification } from "@/lib/notifications";
import type { Product } from "@/types";

const schema = z.object({ productId: z.string(), phone: z.string().min(7).max(20) });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!(await rateLimit(req, "notify", 10, 3600))) {
    return NextResponse.json({ error: "Twòp demann. Eseye pita." }, { status: 429 });
  }
  const business = await getBusinessBySlug(slug);
  if (!business) return NextResponse.json({ error: "Boutik pa jwenn." }, { status: 404 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Antre yon nimewo valid." }, { status: 400 });

  const product = await redis.hgetall<Product>(`product:${parsed.data.productId}`);
  if (!product || product.businessId !== business.id) {
    return NextResponse.json({ error: "Pwodwi pa jwenn." }, { status: 404 });
  }

  const phone = cleanPhone(parsed.data.phone);
  await redis.sadd(`product:${product.id}:waitlist`, phone);
  await pushNotification(
    business.id,
    "new_customer",
    `${phone} vle yon notifikasyon lè ${product.name} disponib ankò.`
  );
  return NextResponse.json({ ok: true });
}
