import { redis } from "@/lib/upstash";
import { addMonthsYmd, ymd } from "@/lib/user-billing";
import { recordSubscriptionSale } from "@/lib/subscription-sale";

/** Yon peman abònman itilizatè ak dat reyèl li (pou revni jodi/mwa/ane yo). */
export interface BillingPayment {
  amount: number;
  paidAt: string; // ISO
  months: number;
  saleId: string; // vant ki kreye nan antrepriz la ("" = poko gen vant)
}

export const paymentsKey = (email: string) => `user:${email.toLowerCase()}:billing-payments`;

export function parsePayment(raw: unknown): BillingPayment | null {
  try {
    const v = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!v || typeof v !== "object") return null;
    const amount = Number((v as BillingPayment).amount);
    const paidAt = String((v as BillingPayment).paidAt ?? "");
    if (!isFinite(amount) || isNaN(new Date(paidAt).getTime())) return null;
    return {
      amount,
      paidAt,
      months: Math.max(1, Number((v as BillingPayment).months) || 1),
      saleId: String((v as BillingPayment).saleId ?? ""),
    };
  } catch {
    return null;
  }
}

/** Istorik peman yo, pi ansyen an premye. */
export async function loadPayments(email: string): Promise<BillingPayment[]> {
  const raw = await redis.lrange(paymentsKey(email), 0, -1);
  return raw.map(parsePayment).filter((x): x is BillingPayment => !!x).reverse();
}

async function savePayments(email: string, list: BillingPayment[]) {
  await redis.del(paymentsKey(email));
  for (const p of list) await redis.lpush(paymentsKey(email), JSON.stringify(p)); // dènye a rete anwo
}

/**
 * Rattrapage: peman ansyen (anvan vant yo te egziste) ak peman ki te fèt ak pri 0 vin antre kòm vant
 * nan antrepriz la, nan dat peman yo. Yon peman ki gen yon vant deja pa touche.
 */
export async function syncUserBillingSales(args: {
  email: string;
  user: Record<string, unknown>;
  businessId: string;
  cashierId: string;
}): Promise<void> {
  const { email, user, businessId, cashierId } = args;
  const price = Number(user.monthlyPrice) || 0;
  if (!businessId || price <= 0) return;

  const got = await redis.set(`ubsync:${email}`, "1", { nx: true, ex: 30 });
  if (!got) return;
  try {
    let list = await loadPayments(email);
    let changed = false;

    if (!list.length) {
      // Pa gen istorik: rebati l ak sa nou konnen (dat kreyasyon, mwa peye yo, dènye peman an).
      const createdAt = user.createdAt ? String(user.createdAt) : "";
      const created = new Date(createdAt);
      const paidMonths = user.paidMonths === undefined || user.paidMonths === null ? 1 : Number(user.paidMonths) || 0;
      if (!createdAt || isNaN(created.getTime()) || paidMonths <= 0) return;
      const lastAt = user.lastPaymentAt ? new Date(String(user.lastPaymentAt)) : null;
      const lastMonths =
        lastAt && !isNaN(lastAt.getTime()) ? Math.min(Math.max(Number(user.lastPaymentMonths) || 1, 1), paidMonths) : 0;
      const earlier = Math.min(paidMonths - lastMonths, 120);
      const createdYmd = ymd(created);
      const nowMs = Date.now();
      for (let k = 0; k < earlier; k++) {
        const due = new Date(`${addMonthsYmd(createdYmd, k)}T12:00:00.000Z`);
        list.push({ amount: 0, paidAt: new Date(Math.min(due.getTime(), nowMs)).toISOString(), months: 1, saleId: "" });
      }
      if (lastMonths > 0 && lastAt) list.push({ amount: 0, paidAt: lastAt.toISOString(), months: lastMonths, saleId: "" });
      changed = list.length > 0;
    }

    for (const p of list) {
      if (p.saleId) continue;
      const amount = price * p.months;
      const sale = await recordSubscriptionSale({
        businessId,
        subscriptionId: `user-billing:${email}`,
        productName: `Abònman platfòm — ${String(user.fullName || email)}`,
        amount,
        cashierId,
        paidAt: p.paidAt,
        silent: true,
      });
      p.amount = amount;
      p.saleId = sale.id;
      changed = true;
    }
    if (changed) await savePayments(email, list);
  } finally {
    await redis.del(`ubsync:${email}`);
  }
}

/** Deplase tout vant peman abònman itilizatè yo nan yon lòt antrepriz (lè kont prensipal la chanje chwa a). */
export async function moveBillingSales(targetId: string): Promise<number> {
  const emails = await redis.smembers("users:all");
  let moved = 0;
  for (const email of emails) {
    for (const p of await loadPayments(email)) {
      if (!p.saleId) continue;
      const sale = await redis.hgetall<{ businessId?: string; createdAt?: string }>(`sale:${p.saleId}`);
      if (!sale || String(sale.businessId) === targetId) continue;
      const day = String(sale.createdAt).slice(0, 10);
      await redis.lrem(`business:${sale.businessId}:sales:${day}`, 0, p.saleId);
      await redis.lpush(`business:${targetId}:sales:${day}`, p.saleId);
      await redis.hset(`sale:${p.saleId}`, { businessId: targetId });
      moved++;
    }
  }
  return moved;
}
