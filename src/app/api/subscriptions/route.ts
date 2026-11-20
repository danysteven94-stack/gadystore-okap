import { NextRequest, NextResponse } from "next/server";
import { userOwnsBusiness } from "@/lib/shop";
import { z } from "zod";
import { randomUUID } from "crypto";
import { redis, hsetClean } from "@/lib/upstash";
import { verifySession } from "@/lib/auth";
import { recordSubscriptionSale } from "@/lib/subscription-sale";
import { scopeKey, paymentsOf, salesBusinessFor, backfillPersonalSales } from "@/lib/subscriptions";
import { addMonthsYmd } from "@/lib/user-billing";

export interface Subscription {
  [key: string]: unknown;
  id: string;
  businessId: string; // "" = abònman pèsonèl (san antrepriz)
  ownerEmail?: string; // itilizatè ki kreye l (itilize pou abònman pèsonèl)
  customerName: string;
  customerId?: string;
  customerPhone?: string; // nimewo WhatsApp/telefòn moun nan (pou voye rapèl)
  productName: string; // ex: Netflix, IPTV, Spotify
  profile?: string; // profil moun nan sou kont lan (ex: "Profil 2", "Ti Jan")
  monthlyPrice: number;
  status: "active" | "expired" | "cancelled";
  startDate: string;
  nextPaymentDate: string; // = startDate + paymentsCount mwa
  paymentsCount?: number; // konbyen mwa ki peye (0 = pa peye ankò)
  saleIds?: string[] | string; // vant ki asosye ak peman yo (pou ka anile dènye a)
  paidDates?: string[] | string; // dat ak lè chak peman (ISO), menm lòd ak saleIds
  createdAt: string;
}

const subscriptionSchema = z.object({
  businessId: z.string().optional(),
  customerName: z.string().min(1),
  customerId: z.string().optional(),
  customerPhone: z.string().trim().max(30).optional(),
  productName: z.string().min(1),
  profile: z.string().trim().max(60).optional(),
  monthlyPrice: z.number().positive(),
  startDate: z.string().min(1),
  paid: z.boolean().default(true), // eske moun nan peye deja lè l pran abònman an?
  paidAt: z.string().optional(), // dat ak lè moun nan peye (ISO); default = kounye a
});

async function getSession(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  return token ? verifySession(token) : null;
}

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });

  // Pa gen businessId = abònman pèsonèl (pa bezwen antrepriz)
  const businessId = req.nextUrl.searchParams.get("businessId") || "";
  if (businessId && !(await userOwnsBusiness(session.email, businessId))) {
    return NextResponse.json({ error: "Aksè refize." }, { status: 403 });
  }

  const ids = await redis.smembers(scopeKey(businessId, session.email));
  const subs = ids.length
    ? await Promise.all(ids.map((id) => redis.hgetall<Subscription>(`subscription:${id}`)))
    : [];

  const validSubs = subs
    .filter((s): s is Subscription => !!s)
    .map((s) => ({ ...s, paymentsCount: paymentsOf(s) }));

  // Ansyen peman pèsonèl ki pa t konte nan dashboard yo antre kounye a (yon sèl fwa chak)
  if (!businessId) {
    try {
      await backfillPersonalSales(session.email, validSubs, session.userId);
    } catch (e) {
      console.error("subscription sales backfill", e);
    }
  }
  const today = new Date().toISOString().slice(0, 10);

  // Mete estati "expired" otomatikman si dat peman an pase
  for (const sub of validSubs) {
    if (sub.status === "active" && sub.nextPaymentDate < today) {
      sub.status = "expired";
    }
  }

  validSubs.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

  // Yon abònman ki poko peye pa konte nan revni an
  const monthlyRevenue = validSubs
    .filter((s) => s.status === "active" && (s.paymentsCount ?? 0) > 0)
    .reduce((sum, s) => sum + s.monthlyPrice, 0);

  const salesBusinessId = businessId || (await salesBusinessFor(session.email, { businessId: "" }));
  return NextResponse.json({ subscriptions: validSubs, monthlyRevenue, salesBusinessId });
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });

  const parsed = subscriptionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { customerName, customerId, customerPhone, productName, monthlyPrice, paid, profile } = parsed.data;
  const businessId = parsed.data.businessId || "";
  const startDate = parsed.data.startDate.slice(0, 10);
  const paidAtDate = parsed.data.paidAt ? new Date(parsed.data.paidAt) : new Date();
  if (isNaN(paidAtDate.getTime())) {
    return NextResponse.json({ error: "Dat peman an envalid." }, { status: 400 });
  }
  const paidAt = paidAtDate.toISOString();
  if (businessId && !(await userOwnsBusiness(session.email, businessId))) {
    return NextResponse.json({ error: "Aksè refize." }, { status: 403 });
  }

  const paymentsCount = paid ? 1 : 0;
  const subscription: Subscription = {
    id: randomUUID(),
    businessId,
    ownerEmail: session.email.toLowerCase(),
    customerName,
    customerId,
    customerPhone: customerPhone || undefined,
    productName,
    profile: profile || undefined,
    monthlyPrice,
    status: "active",
    startDate,
    paymentsCount,
    // Si pa peye: peman an dwe depi dat kòmansman an
    nextPaymentDate: addMonthsYmd(startDate, paymentsCount),
    saleIds: "[]",
    paidDates: paid ? JSON.stringify([paidAt]) : "[]",
    createdAt: new Date().toISOString(),
  };

  // Premye peman an (si moun nan peye deja) kontabilize kòm yon vant. Yon abònman pèsonèl
  // antre nan antrepriz streaming itilizatè a (oswa premye antrepriz li a), si l gen youn.
  const salesBizId = paid ? await salesBusinessFor(session.email, { businessId }) : "";
  if (paid && salesBizId) {
    const sale = await recordSubscriptionSale({
      businessId: salesBizId,
      subscriptionId: subscription.id,
      productName,
      amount: monthlyPrice,
      customerId,
      cashierId: session.userId,
      paidAt,
    });
    subscription.saleIds = JSON.stringify([sale.id]);
  }

  await hsetClean(`subscription:${subscription.id}`, subscription as unknown as Record<string, unknown>);
  await redis.sadd(scopeKey(businessId, session.email), subscription.id);

  return NextResponse.json({ subscription }, { status: 201 });
}

