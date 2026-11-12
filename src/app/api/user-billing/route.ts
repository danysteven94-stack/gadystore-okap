import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { redis } from "@/lib/upstash";
import { verifySession, isSuperAdmin, SUPER_ADMIN_EMAIL } from "@/lib/auth";
import { isTrue } from "@/lib/password";
import { billingInfo, type BillingStatus } from "@/lib/user-billing";

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

export async function GET(req: NextRequest) {
  const auth = await getSuperSession(req);
  if (auth.error) return auth.error;

  const emails = await redis.smembers("users:all");
  const rows = await Promise.all(
    emails.map(async (email) => {
      if (email.toLowerCase() === SUPER_ADMIN_EMAIL) return null;
      const r = await redis.hgetall<Record<string, unknown>>(`user:${email}`);
      if (!r || !r.id) return null;
      const createdAt = r.createdAt ? String(r.createdAt) : "";
      const paidMonths = r.paidMonths === undefined || r.paidMonths === null ? 1 : Number(r.paidMonths) || 0;
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

  if (req.nextUrl.searchParams.get("summary")) return NextResponse.json({ summary });
  // Pi ijan an premye: an reta, jodi a, pwòch, apre sa peye.
  const order: Record<BillingStatus, number> = { overdue: 0, due_today: 1, soon: 2, paid: 3 };
  users.sort((a, b) => order[a.status] - order[b.status] || a.nextDue.localeCompare(b.nextDue));
  return NextResponse.json({ users, summary });
}

const patchSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("pay"), email: z.string(), months: z.number().int().min(1).max(36) }),
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
    await redis.hset(`user:${email}`, {
      paidMonths: paidMonths + body.months,
      lastPaymentAt: new Date().toISOString(),
      lastPaymentMonths: body.months,
    });
  } else {
    await redis.hset(`user:${email}`, { paidMonths: Math.max(0, paidMonths - 1) });
  }
  return NextResponse.json({ ok: true });
}
