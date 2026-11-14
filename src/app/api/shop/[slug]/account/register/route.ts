import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { redis, hsetClean } from "@/lib/upstash";
import { hashPassword } from "@/lib/auth";
import { getBusinessBySlug, rateLimit, cleanPhone } from "@/lib/shop";
import { emailNorm, signCustomerToken, setCustomerCookie, toCustomer } from "@/lib/shop-customer";
import type { Customer } from "@/types";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().min(7).max(20),
  email: z.string().trim().email().max(120),
  address: z.string().trim().max(200).optional(),
  password: z.string().min(8).max(100),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!(await rateLimit(req, "shopcust-register", 6, 3600))) {
    return NextResponse.json({ error: "Twòp eseye. Tann yon ti tan epi eseye ankò." }, { status: 429 });
  }
  const business = await getBusinessBySlug(slug);
  if (!business) return NextResponse.json({ error: "Boutik pa jwenn." }, { status: 404 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ranpli non, telefòn, imèl valid, epi yon modpas ki gen omwen 8 karaktè." },
      { status: 400 }
    );
  }
  const { name, address, password } = parsed.data;
  const email = emailNorm(parsed.data.email);
  const phone = cleanPhone(parsed.data.phone);
  if (phone.replace(/\D/g, "").length < 7) {
    return NextResponse.json({ error: "Nimewo telefòn pa valid." }, { status: 400 });
  }

  const id = randomUUID();
  // Rezève imèl la atomikman (de moun pa ka kreye menm kont lan an menm tan)
  const claimed = await redis.set(`shopcust:email:${business.id}:${email}`, id, { nx: true });
  if (!claimed) {
    return NextResponse.json({ error: "Gen yon kont ak imèl sa a deja. Konekte olye." }, { status: 409 });
  }

  const rec = {
    id,
    businessId: business.id,
    name,
    phone,
    email,
    address: address || "",
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString(),
  };
  await hsetClean(`shopcust:${id}`, rec);
  await redis.sadd(`business:${business.id}:shopcustomers`, id);

  // Mete kliyan an nan lis Kontak (CRM) pwopriyetè a tou
  const crm: Customer = { id, businessId: business.id, name, phone, email, address: address || undefined };
  await hsetClean(`customer:${id}`, crm as unknown as Record<string, unknown>);
  await redis.sadd(`business:${business.id}:customers`, id);

  const res = NextResponse.json({ customer: toCustomer(rec) }, { status: 201 });
  setCustomerCookie(res, slug, await signCustomerToken(id, business.id));
  return res;
}
