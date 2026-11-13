import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { redis } from "@/lib/upstash";
import { getSessionFromReq, userOwnsBusiness, normCode, getCoupon, type Coupon } from "@/lib/shop";

async function guard(req: NextRequest, businessId: string | null) {
  const session = await getSessionFromReq(req);
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });
  if (!businessId) return NextResponse.json({ error: "businessId obligatwa." }, { status: 400 });
  if (!(await userOwnsBusiness(session.email, businessId))) {
    return NextResponse.json({ error: "Aksè refize." }, { status: 403 });
  }
  return null;
}

export async function GET(req: NextRequest) {
  const businessId = req.nextUrl.searchParams.get("businessId");
  const denied = await guard(req, businessId);
  if (denied) return denied;

  const codes = await redis.smembers(`business:${businessId}:coupons`);
  const rows = await Promise.all(codes.map((c) => getCoupon(businessId as string, String(c))));
  const coupons = rows.filter((c): c is Coupon => !!c).sort((a, b) => a.code.localeCompare(b.code));
  return NextResponse.json({ coupons });
}

const schema = z.object({
  businessId: z.string(),
  code: z.string().min(3).max(20),
  type: z.enum(["percent", "fixed"]),
  value: z.number().positive(),
  minOrder: z.number().nonnegative().optional(),
  maxUses: z.number().int().nonnegative().optional(),
  expiresAt: z.string().max(10).optional(), // YYYY-MM-DD
  active: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const denied = await guard(req, typeof body?.businessId === "string" ? body.businessId : null);
  if (denied) return denied;

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Done pa valid." }, { status: 400 });
  const d = parsed.data;
  const code = normCode(d.code);
  if (code.length < 3) return NextResponse.json({ error: "Kòd la dwe gen omwen 3 karaktè (lèt/chif)." }, { status: 400 });
  if (d.type === "percent" && d.value > 100) {
    return NextResponse.json({ error: "Pousantaj la pa ka depase 100." }, { status: 400 });
  }
  if (d.expiresAt && !/^\d{4}-\d{2}-\d{2}$/.test(d.expiresAt)) {
    return NextResponse.json({ error: "Dat ekspirasyon an dwe YYYY-MM-JJ." }, { status: 400 });
  }

  const existing = await getCoupon(d.businessId, code);
  await redis.hset(`coupon:${d.businessId}:${code}`, {
    code,
    type: d.type,
    value: d.value,
    minOrder: d.minOrder ?? 0,
    maxUses: d.maxUses ?? 0,
    uses: existing?.uses ?? 0,
    expiresAt: d.expiresAt ?? "",
    active: d.active ?? true,
  });
  await redis.sadd(`business:${d.businessId}:coupons`, code);
  return NextResponse.json({ ok: true, code }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const businessId = typeof body?.businessId === "string" ? body.businessId : null;
  const denied = await guard(req, businessId);
  if (denied) return denied;
  const code = normCode(String(body?.code ?? ""));
  const c = await getCoupon(businessId as string, code);
  if (!c) return NextResponse.json({ error: "Koupon pa jwenn." }, { status: 404 });
  await redis.hset(`coupon:${businessId}:${code}`, { active: !!body?.active });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const businessId = req.nextUrl.searchParams.get("businessId");
  const denied = await guard(req, businessId);
  if (denied) return denied;
  const code = normCode(req.nextUrl.searchParams.get("code") ?? "");
  if (!code) return NextResponse.json({ error: "Kòd obligatwa." }, { status: 400 });
  await redis.del(`coupon:${businessId}:${code}`);
  await redis.srem(`business:${businessId}:coupons`, code);
  return NextResponse.json({ ok: true });
}
