import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { redis } from "@/lib/upstash";
import { verifySession, isSuperAdmin, SUPER_ADMIN_EMAIL } from "@/lib/auth";
import { isTrue } from "@/lib/password";
import { billingInfo, addMonthsYmd, ymd, type BillingStatus } from "@/lib/user-billing";
import { notifyPaymentReceived } from "@/lib/billing-notify";

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

/** Yon peman abònman itilizatè ak dat reyèl li (pou revni jodi/mwa/ane yo). */
interface BillingPayment {
  amount: number;
  paidAt: string; // ISO
}

const paymentsKey = (email: string) => `user:${email.toLowerCase()}:billing-payments`;

function parsePayment(raw: unknown): BillingPayment | null {
  try {
    const v = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!v || typeof v !== "object") return null;
    const amount = Number((v as BillingPayment).amount);
    const paidAt = String((v as BillingPayment).paidAt ?? "");
    if (!isFinite(amount) || isNaN(new Date(paidAt).getTime())) return null;
    return { amount, paidAt };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const auth = await getSuperSession(req);
  if (auth.error) return auth.error;

  const emails = await redis.smembers("users:all");
  const todayYmd = ymd(new Date());
  const monthPrefix = todayYmd.slice(0, 7);
  const yearPrefix = todayYmd.slice(0, 4);
  // Revni reyèl abònman yo, chak peman nan jou li te fèt la (lè Ayiti) — PA total mansyèl la.
  const periodRevenue = { today: 0, month: 0, year: 0 };
  const rows = await Promise.all(
    emails.map(async (email) => {
      if (email.toLowerCase() === SUPER_ADMIN_EMAIL) return null;
      const r = await redis.hgetall<Record<string, unknown>>(`user:${email}`);
      if (!r || !r.id) return null;
      const createdAt = r.createdAt ? String(r.createdAt) : "";
      const paidMonths = r.paidMonths === undefined || r.paidMonths === null ? 1 : Number(r.paidMonths) || 0;

      // Peman yo ak dat yo. Si itilizatè a poko gen istorik (ansyen done), nou dedui yon sèl peman.
      const logRaw = await redis.lrange(paymentsKey(String(r.email)), 0, -1);
      let payments = logRaw.map(parsePayment).filter((x): x is BillingPayment => !!x);
      if (!payments.length) {
        const price = Number(r.monthlyPrice) || 0;
        if (r.lastPaymentAt) {
          const months = Number(r.lastPaymentMonths) || 1;
          payments = [{ amount: price * months, paidAt: String(r.lastPaymentAt) }];
        } else if (createdAt && paidMonths > 0) {
          payments = [{ amount: price, paidAt: createdAt }];
        }
      }
      for (const p of payments) {
        const day = ymd(new Date(p.paidAt));
        if (day === todayYmd) periodRevenue.today += p.amount;
        if (day.startsWith(monthPrefix)) periodRevenue.month += p.amount;
        if (day.startsWith(yearPrefix)) periodRevenue.year += p.amount;
      }
      const info = billingInfo(createdAt, paidMonths);
      if (!info) return null;
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

  if (req.nextUrl.searchParams.get("summary")) return NextResponse.json({ summary, periodRevenue });
  // Pi ijan an premye: an reta, jodi a, pwòch, apre sa peye.
  const order: Record<BillingStatus, number> = { overdue: 0, due_today: 1, soon: 2, paid: 3 };
  users.sort((a, b) => order[a.status] - order[b.status] || a.nextDue.localeCompare(b.nextDue));
  return NextResponse.json({ users, summary, periodRevenue });
}

const patchSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("pay"), email: z.string(), months: z.number().int().min(1).max(36), paidAt: z.string().optional() }),
  z.object({ action: z.literal("undo"), email: z.string() }),
  z.object({ action: z.literal("set_price"), email: z.string(), price: z.number().min(0).max(100000000) }),
]);

export async function PATCH(req: NextRequest) {
  const auth = await getSuperSession(req);
  if (auth.error) return auth.error;

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Done envalid." }, { status: 400 });
  const body = parsed.data;
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
    const paidAtDate = body.paidAt ? new Date(body.paidAt) : new Date();
    if (isNaN(paidAtDate.getTime())) return NextResponse.json({ error: "Dat peman an envalid." }, { status: 400 });
    const paidAtIso = paidAtDate.toISOString();
    await redis.hset(`user:${email}`, {
      paidMonths: paidMonths + body.months,
      lastPaymentAt: paidAtIso,
      lastPaymentMonths: body.months,
    });
    // Sove peman an ak dat reyèl li, pou revni a konte nan bon jou a.
    const price = Number(user.monthlyPrice) || 0;
    await redis.lpush(paymentsKey(email), JSON.stringify({ amount: price * body.months, paidAt: paidAtIso }));
    // Notification (push) à l'utilisateur : paiement reçu + prochaine échéance.
    const createdAt = user.createdAt ? String(user.createdAt) : "";
    const d = new Date(createdAt);
    if (createdAt && !isNaN(d.getTime())) {
      await notifyPaymentReceived(email, body.months, addMonthsYmd(ymd(d), paidMonths + body.months));
    }
  } else {
    await redis.hset(`user:${email}`, { paidMonths: Math.max(0, paidMonths - 1) });
    // Retire dènye peman an nan istorik la (si genyen) pou revni a korije.
    const removed = await redis.lpop(paymentsKey(email));
    if (!removed && user.lastPaymentAt) await redis.hset(`user:${email}`, { lastPaymentAt: "", lastPaymentMonths: 0 });
  }
  return NextResponse.json({ ok: true });
}
