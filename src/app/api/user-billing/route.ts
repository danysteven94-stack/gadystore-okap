import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { redis } from "@/lib/upstash";
import { verifySession, isSuperAdmin, SUPER_ADMIN_EMAIL } from "@/lib/auth";
import { isTrue } from "@/lib/password";
import { billingInfo, addMonthsYmd, ymd, type BillingStatus } from "@/lib/user-billing";
import { notifyPaymentReceived } from "@/lib/billing-notify";
import { userOwnsBusiness } from "@/lib/shop";
import { recordSubscriptionSale, undoSubscriptionSale } from "@/lib/subscription-sale";
import { getUserBusinessIds } from "@/lib/shop";
import { paymentsKey, parsePayment, syncUserBillingSales, moveBillingSales } from "@/lib/user-billing-sales";

async function getSuperSession(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return { error: NextResponse.json({ error: "Pa otorize." }, { status: 401 }) };
  if (!isSuperAdmin(session.email)) {
    return { error: NextResponse.json({ error: "Sèl kont prensipal la ka wè abònman itilizatè yo." }, { status: 403 }) };
  }
  return { session };
}

export interface BillingUser {
  email: string;
  fullName: string;
  role: string;
  disabled: boolean;
  createdAt: string;
  createdYmd: string;
  monthlyPrice: number;
  paidMonths: number;
  nextDue: string;
  daysUntil: number;
  monthsOverdue: number;
  amountOwed: number;
  status: BillingStatus;
  lastPaymentAt: string;
}

/** Antrepriz ki resevwa vant peman abònman itilizatè yo (chwa kont prensipal la). */
async function billingBusinessOf(email: string): Promise<string> {
  const pref = await redis.hget<string>(`user:${email.toLowerCase()}`, "billingBusinessId");
  return pref ? String(pref) : "";
}

export async function GET(req: NextRequest) {
  const auth = await getSuperSession(req);
  if (auth.error) return auth.error;

  const emails = await redis.smembers("users:all");
  const viewer = auth.session;
  // Rattrapage vant yo (sèlman lè paj la louvri, pa nan rekèt rapid sidebar la)
  const isSummary = !!req.nextUrl.searchParams.get("summary");
  const effectiveBiz = (await billingBusinessOf(viewer.email)) || (await getUserBusinessIds(viewer.email))[0] || "";
  const syncBizId = isSummary ? "" : effectiveBiz;
  const rows = await Promise.all(
    emails.map(async (email) => {
      if (email.toLowerCase() === SUPER_ADMIN_EMAIL) return null;
      const r = await redis.hgetall<Record<string, unknown>>(`user:${email}`);
      if (!r || !r.id) return null;
      const createdAt = r.createdAt ? String(r.createdAt) : "";
      const paidMonths = r.paidMonths === undefined || r.paidMonths === null ? 1 : Number(r.paidMonths) || 0;

      const info = billingInfo(createdAt, paidMonths);
      if (!info) return null;
      if (syncBizId) {
        try {
          await syncUserBillingSales({ email: String(r.email), user: r, businessId: syncBizId, cashierId: viewer.userId });
        } catch (e) {
          console.error("user billing sales sync", e);
        }
      }
      const monthlyPrice = Number(r.monthlyPrice) || 0;
      const u: BillingUser = {
        email: String(r.email),
        fullName: r.fullName ? String(r.fullName) : "",
        role: String(r.role ?? ""),
        disabled: isTrue(r.disabled),
        createdAt,
        createdYmd: info.createdYmd,
        monthlyPrice,
        paidMonths,
        nextDue: info.nextDue,
        daysUntil: info.daysUntil,
        monthsOverdue: info.monthsOverdue,
        amountOwed: info.monthsOverdue * monthlyPrice,
        status: info.status,
        lastPaymentAt: r.lastPaymentAt ? String(r.lastPaymentAt) : "",
      };
      return u;
    })
  );
  const users = rows.filter((u): u is BillingUser => !!u);
  const active = users.filter((u) => !u.disabled);
  const summary = {
    total: users.length,
    overdue: active.filter((u) => u.status === "overdue").length,
    dueToday: active.filter((u) => u.status === "due_today").length,
    soon: active.filter((u) => u.status === "soon").length,
    monthlyRevenue: active.reduce((s, u) => s + u.monthlyPrice, 0),
    totalOwed: active.reduce((s, u) => s + u.amountOwed, 0),
  };

  if (req.nextUrl.searchParams.get("summary")) return NextResponse.json({ summary });
  // Pi ijan an premye: an reta, jodi a, pwòch, apre sa peye.
  const order: Record<BillingStatus, number> = { overdue: 0, due_today: 1, soon: 2, paid: 3 };
  users.sort((a, b) => order[a.status] - order[b.status] || a.nextDue.localeCompare(b.nextDue));
  return NextResponse.json({ users, summary, billingBusinessId: effectiveBiz });
}

const patchSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("pay"), email: z.string(), months: z.number().int().min(1).max(36), paidAt: z.string().optional(), businessId: z.string().optional() }),
  z.object({ action: z.literal("undo"), email: z.string() }),
  z.object({ action: z.literal("set_business"), businessId: z.string().min(1) }),
  z.object({ action: z.literal("set_price"), email: z.string(), price: z.number().min(0).max(100000000) }),
]);

export async function PATCH(req: NextRequest) {
  const auth = await getSuperSession(req);
  if (auth.error) return auth.error;

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Done envalid." }, { status: 400 });
  const body = parsed.data;

  // Chwazi antrepriz ki resevwa vant yo: sove chwa a epi deplase vant ki deja kreye yo.
  if (body.action === "set_business") {
    if (!(await userOwnsBusiness(auth.session.email, body.businessId))) {
      return NextResponse.json({ error: "Aksè refize." }, { status: 403 });
    }
    await redis.hset(`user:${auth.session.email.toLowerCase()}`, { billingBusinessId: body.businessId });
    const moved = await moveBillingSales(body.businessId);
    return NextResponse.json({ ok: true, moved });
  }

  const email = body.email.trim().toLowerCase();
  if (email === SUPER_ADMIN_EMAIL) {
    return NextResponse.json({ error: "Kont prensipal la pa gen abònman." }, { status: 400 });
  }
  const user = await redis.hgetall<Record<string, unknown>>(`user:${email}`);
  if (!user || !user.id) return NextResponse.json({ error: "Itilizatè pa jwenn." }, { status: 404 });

  const paidMonths = user.paidMonths === undefined || user.paidMonths === null ? 1 : Number(user.paidMonths) || 0;

  if (body.action === "set_price") {
    await redis.hset(`user:${email}`, { monthlyPrice: Math.round(body.price) });
  } else if (body.action === "pay") {
    const session = auth.session;
    const price = Number(user.monthlyPrice) || 0;
    const amount = price * body.months;
    const paidAtDate = body.paidAt ? new Date(body.paidAt) : new Date();
    if (isNaN(paidAtDate.getTime())) return NextResponse.json({ error: "Dat peman an envalid." }, { status: 400 });
    const paidAtIso = paidAtDate.toISOString();

    // Antrepriz ki resevwa vant la: chwa fòm lan, sinon dènye chwa a. Peman an antre kòm yon vant
    // (revni/rapò/dashboard) nan jou li te peye a, tankou abònman streaming yo.
    const businessId = body.businessId || (await billingBusinessOf(session.email));
    if (businessId && !(await userOwnsBusiness(session.email, businessId))) {
      return NextResponse.json({ error: "Aksè refize." }, { status: 403 });
    }
    let saleId = "";
    if (businessId && amount > 0) {
      const sale = await recordSubscriptionSale({
        businessId,
        subscriptionId: `user-billing:${email}`,
        productName: `Abònman platfòm — ${String(user.fullName || email)}`,
        amount,
        cashierId: session.userId,
        paidAt: paidAtIso,
      });
      saleId = sale.id;
    }
    if (businessId) await redis.hset(`user:${session.email.toLowerCase()}`, { billingBusinessId: businessId });
    await redis.lpush(paymentsKey(email), JSON.stringify({ amount, paidAt: paidAtIso, months: body.months, saleId }));

    await redis.hset(`user:${email}`, {
      paidMonths: paidMonths + body.months,
      lastPaymentAt: paidAtIso,
      lastPaymentMonths: body.months,
    });
    // Notification (push) à l'utilisateur : paiement reçu + prochaine échéance.
    const createdAt = user.createdAt ? String(user.createdAt) : "";
    const d = new Date(createdAt);
    if (createdAt && !isNaN(d.getTime())) {
      await notifyPaymentReceived(email, body.months, addMonthsYmd(ymd(d), paidMonths + body.months));
    }
  } else {
    // Anile dènye peman an: retire vant lan nan revni yo epi retire mwa yo li te peye yo.
    const last = parsePayment(await redis.lpop(paymentsKey(email)));
    const undoMonths = last ? last.months : 1;
    if (last?.saleId) await undoSubscriptionSale(last.saleId);
    await redis.hset(`user:${email}`, { paidMonths: Math.max(0, paidMonths - undoMonths) });
    if (!last && user.lastPaymentAt) await redis.hset(`user:${email}`, { lastPaymentAt: "", lastPaymentMonths: 0 });
  }
  return NextResponse.json({ ok: true });
}
