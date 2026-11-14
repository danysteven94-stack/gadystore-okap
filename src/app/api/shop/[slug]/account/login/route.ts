import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { redis } from "@/lib/upstash";
import { verifyPassword } from "@/lib/auth";
import { getBusinessBySlug, rateLimit } from "@/lib/shop";
import { emailNorm, signCustomerToken, setCustomerCookie, toCustomer, str } from "@/lib/shop-customer";

const schema = z.object({ email: z.string().trim().email(), password: z.string().min(1).max(100) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!(await rateLimit(req, "shopcust-login", 20, 900))) {
    return NextResponse.json({ error: "Twòp eseye. Tann 15 minit epi eseye ankò." }, { status: 429 });
  }
  const business = await getBusinessBySlug(slug);
  if (!business) return NextResponse.json({ error: "Boutik pa jwenn." }, { status: 404 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Antre yon imèl ak yon modpas valid." }, { status: 400 });

  const email = emailNorm(parsed.data.email);
  const emailKey = `rl:shopcust-login:${business.id}:${email}`;
  const attempts = await redis.incr(emailKey);
  if (attempts === 1) await redis.expire(emailKey, 900);
  if (attempts > 8) {
    return NextResponse.json({ error: "Twòp eseye pou kont sa a. Tann 15 minit." }, { status: 429 });
  }

  const id = await redis.get<string>(`shopcust:email:${business.id}:${email}`);
  const rec = id ? await redis.hgetall<Record<string, unknown>>(`shopcust:${id}`) : null;
  if (!rec || !rec.passwordHash || !(await verifyPassword(parsed.data.password, str(rec.passwordHash)))) {
    return NextResponse.json({ error: "Imèl oswa modpas pa kòrèk." }, { status: 401 });
  }

  await redis.del(emailKey);
  const res = NextResponse.json({ customer: toCustomer(rec) });
  setCustomerCookie(res, slug, await signCustomerToken(str(rec.id), business.id));
  return res;
}
