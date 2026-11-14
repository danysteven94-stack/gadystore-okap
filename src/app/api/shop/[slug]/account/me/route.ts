import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { redis, hsetClean } from "@/lib/upstash";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { cleanPhone, rateLimit } from "@/lib/shop";
import { clearCustomerCookie, getShopCustomer, str } from "@/lib/shop-customer";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

/** Pwofil + dènye kòmand yo. */
export async function GET(req: NextRequest, { params }: Ctx) {
  const { slug } = await params;
  const { customer } = await getShopCustomer(req, slug);
  if (!customer) return NextResponse.json({ customer: null });

  const ids = await redis.lrange<string>(`shopcust:${customer.id}:orders`, 0, 19);
  const raw = await Promise.all(ids.map((id) => redis.hgetall<Record<string, unknown>>(`order:${id}`)));
  const orders = raw
    .filter((o): o is Record<string, unknown> => !!o && !!o.id)
    .map((o) => ({
      code: str(o.code),
      total: Number(o.totalAmount) || 0,
      fulfillment: str(o.fulfillment) || "new",
      deliveryMethod: str(o.deliveryMethod),
      createdAt: str(o.createdAt),
      phone: str(o.customerPhone),
    }));
  return NextResponse.json({ customer, orders });
}

const profileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().min(7).max(20),
  address: z.string().trim().max(200).optional(),
});
const passwordSchema = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(8).max(100) });

/** Modifye pwofil (name/phone/address) OSWA chanje modpas ({currentPassword,newPassword}). */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { slug } = await params;
  const { customer, rec } = await getShopCustomer(req, slug);
  if (!customer || !rec) return NextResponse.json({ error: "Ou pa konekte." }, { status: 401 });
  const body = await req.json().catch(() => null);

  if (body && typeof body === "object" && "newPassword" in body) {
    if (!(await rateLimit(req, "shopcust-pw", 10, 900))) {
      return NextResponse.json({ error: "Twòp eseye. Tann yon ti tan." }, { status: 429 });
    }
    const p = passwordSchema.safeParse(body);
    if (!p.success) return NextResponse.json({ error: "Nouvo modpas la dwe gen omwen 8 karaktè." }, { status: 400 });
    if (!(await verifyPassword(p.data.currentPassword, str(rec.passwordHash)))) {
      return NextResponse.json({ error: "Modpas aktyèl la pa kòrèk." }, { status: 401 });
    }
    await redis.hset(`shopcust:${customer.id}`, { passwordHash: await hashPassword(p.data.newPassword) });
    return NextResponse.json({ ok: true });
  }

  const p = profileSchema.safeParse(body);
  if (!p.success) return NextResponse.json({ error: "Verifye non ou ak nimewo telefòn ou." }, { status: 400 });
  const update = { name: p.data.name, phone: cleanPhone(p.data.phone), address: p.data.address ?? "" };
  await hsetClean(`shopcust:${customer.id}`, update);
  // Kenbe fich Kontak (CRM) la ajou tou
  await hsetClean(`customer:${customer.id}`, { ...update, address: update.address || undefined });
  return NextResponse.json({ customer: { ...customer, ...update } });
}

/** Efase kont lan (obligatwa pou App Store/Play Store). Kòmand ki deja pase rete nan istorik boutik la. */
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { slug } = await params;
  const { customer, rec, business } = await getShopCustomer(req, slug);
  if (!customer || !rec || !business) return NextResponse.json({ error: "Ou pa konekte." }, { status: 401 });
  if (!(await rateLimit(req, "shopcust-del", 10, 900))) {
    return NextResponse.json({ error: "Twòp eseye. Tann yon ti tan." }, { status: 429 });
  }
  const body = await req.json().catch(() => null);
  const pw = body && typeof body.password === "string" ? body.password : "";
  if (!pw || !(await verifyPassword(pw, str(rec.passwordHash)))) {
    return NextResponse.json({ error: "Modpas la pa kòrèk." }, { status: 401 });
  }

  await Promise.all([
    redis.del(`shopcust:${customer.id}`),
    redis.del(`shopcust:email:${business.id}:${customer.email}`),
    redis.del(`shopcust:${customer.id}:orders`),
    redis.srem(`business:${business.id}:shopcustomers`, customer.id),
    redis.del(`customer:${customer.id}`),
    redis.srem(`business:${business.id}:customers`, customer.id),
  ]);
  const res = NextResponse.json({ ok: true });
  clearCustomerCookie(res, slug);
  return res;
}
