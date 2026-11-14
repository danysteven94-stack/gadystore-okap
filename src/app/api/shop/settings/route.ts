import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { redis } from "@/lib/upstash";
import {
  getSessionFromReq,
  getUserBusinessIds,
  uniqueSlug,
  slugify,
  isTrue,
  RESERVED_SLUGS,
  cleanPhone,
} from "@/lib/shop";
import type { Business } from "@/types";

export async function GET(req: NextRequest) {
  const session = await getSessionFromReq(req);
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });

  const ids = await getUserBusinessIds(session.email);
  const rows = ids.length ? await Promise.all(ids.map((id) => redis.hgetall<Business>(`business:${id}`))) : [];

  const shops = await Promise.all(
    rows
      .filter((b): b is Business => !!b && !!b.id)
      .map(async (b) => {
        const pids = await redis.smembers(`business:${b.id}:products`);
        const products = pids.length ? await Promise.all(pids.map((p) => redis.hgetall<Record<string, unknown>>(`product:${p}`))) : [];
        const valid = products.filter(Boolean) as Record<string, unknown>[];
        return {
          id: b.id,
          name: b.name,
          icon: b.icon,
          slug: String(b.slug ?? ""),
          shopEnabled: isTrue(b.shopEnabled),
          whatsapp: String(b.whatsapp ?? ""),
          shopName: String(b.shopName ?? ""),
          shopLogo: String(b.shopLogo ?? ""),
          shopCover: String(b.shopCover ?? ""),
          shopTagline: String(b.shopTagline ?? ""),
          shopPaymentInfo: String(b.shopPaymentInfo ?? ""),
          shopAnnouncement: String(b.shopAnnouncement ?? ""),
          shopAbout: String(b.shopAbout ?? ""),
          shopReturns: String(b.shopReturns ?? ""),
          shopAddress: String(b.shopAddress ?? ""),
          shopDeliveryFee: Number(b.shopDeliveryFee) || 0,
          shopFreeDeliveryMin: Number(b.shopFreeDeliveryMin) || 0,
          shopPickup: isTrue(b.shopPickup),
          productCount: valid.length,
          publishedCount: valid.filter((p) => isTrue(p.published)).length,
        };
      })
  );

  return NextResponse.json({ shops });
}

const patchSchema = z.object({
  businessId: z.string(),
  shopEnabled: z.boolean().optional(),
  slug: z.string().min(2).max(40).optional(),
  whatsapp: z.coerce.string().max(20).optional(),
  shopName: z.string().max(60).optional(),
  shopLogo: z.string().refine((v) => v === "" || v.startsWith("/api/img/")).optional(),
  shopCover: z.string().refine((v) => v === "" || v.startsWith("/api/img/")).optional(),
  shopTagline: z.string().max(60).optional(),
  shopPaymentInfo: z.string().max(300).optional(),
  shopAnnouncement: z.string().max(100).optional(),
  shopAbout: z.string().max(400).optional(),
  shopReturns: z.string().max(300).optional(),
  shopAddress: z.string().max(150).optional(),
  shopDeliveryFee: z.number().nonnegative().max(1e9).optional(),
  shopFreeDeliveryMin: z.number().nonnegative().max(1e9).optional(),
  shopPickup: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await getSessionFromReq(req);
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Done pa valid." }, { status: 400 });
  const { businessId, slug, ...rest } = parsed.data;

  if (!(await getUserBusinessIds(session.email)).includes(businessId)) {
    return NextResponse.json({ error: "Aksè refize." }, { status: 403 });
  }
  const business = await redis.hgetall<Business>(`business:${businessId}`);
  if (!business) return NextResponse.json({ error: "Antrepriz pa jwenn." }, { status: 404 });

  const updates: Record<string, unknown> = {};
  if (rest.shopEnabled !== undefined) updates.shopEnabled = rest.shopEnabled;
  if (rest.whatsapp !== undefined) updates.whatsapp = cleanPhone(rest.whatsapp).replace(/^\+/, "");
  if (rest.shopName !== undefined) updates.shopName = rest.shopName.trim();
  if (rest.shopLogo !== undefined) updates.shopLogo = rest.shopLogo;
  if (rest.shopCover !== undefined) updates.shopCover = rest.shopCover;
  if (rest.shopTagline !== undefined) updates.shopTagline = rest.shopTagline.trim();
  if (rest.shopPaymentInfo !== undefined) updates.shopPaymentInfo = rest.shopPaymentInfo.trim();
  if (rest.shopAnnouncement !== undefined) updates.shopAnnouncement = rest.shopAnnouncement.trim();
  if (rest.shopAbout !== undefined) updates.shopAbout = rest.shopAbout.trim();
  if (rest.shopReturns !== undefined) updates.shopReturns = rest.shopReturns.trim();
  if (rest.shopAddress !== undefined) updates.shopAddress = rest.shopAddress.trim();
  if (rest.shopDeliveryFee !== undefined) updates.shopDeliveryFee = rest.shopDeliveryFee;
  if (rest.shopFreeDeliveryMin !== undefined) updates.shopFreeDeliveryMin = rest.shopFreeDeliveryMin;
  if (rest.shopPickup !== undefined) updates.shopPickup = rest.shopPickup;

  // Slug: kreye otomatikman premye fwa a, oswa chanje si moun nan mande
  let nextSlug = business.slug as string | undefined;
  if (slug !== undefined) {
    const wanted = slugify(slug);
    if (RESERVED_SLUGS.has(wanted)) {
      return NextResponse.json({ error: "Non sa a rezève. Chwazi yon lòt." }, { status: 409 });
    }
    const owner = await redis.get<string>(`shop:slug:${wanted}`);
    if (owner && owner !== businessId) {
      return NextResponse.json({ error: "Lyen sa a deja pran. Chwazi yon lòt." }, { status: 409 });
    }
    nextSlug = wanted;
  } else if (!nextSlug) {
    nextSlug = await uniqueSlug(business.name, businessId);
  }

  if (nextSlug !== business.slug) {
    await redis.set(`shop:slug:${nextSlug}`, businessId);
    if (business.slug) await redis.del(`shop:slug:${business.slug}`);
    updates.slug = nextSlug;
  }

  if (Object.keys(updates).length) await redis.hset(`business:${businessId}`, updates);

  return NextResponse.json({ ok: true, slug: nextSlug });
}
