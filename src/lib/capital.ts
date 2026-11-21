import { redis, hgetallMany, hmgetMany } from "@/lib/upstash";
import type { Business, CapitalSummary, Investment, InvestmentSource, Product, Transfer } from "@/types";

/**
 * KALKIL KAPITAL (pa antrepriz)
 *
 *   kes     = envestisman → kes + vant kach + transfè → kes − depans (kes) − retou − transfè → labank
 *   labank  = envestisman → labank + vant kat/mobile money + transfè → labank − depans (labank) − transfè → kes
 *   kapital = kes + labank + valè stok (a pri acha)
 *   gen/pèt = kapital − total envesti
 *
 * Swivi a kòmanse nan dat ki pi ansyen ant kreyasyon antrepriz la ak premye envestisman an,
 * konsa vant yo (ansanm ak peman abònman yo) konte nan kes la menm si pa gen envestisman ankò.
 * Kòb ou te gen deja nan kes/labank anvan sa, ajoute l kòm yon envestisman (kòb depa).
 *
 * Chanje kote yon metòd peman ale isit la si w vle:
 */
export const BANK_PAYMENT_METHODS = new Set(["card", "mobile_money"]);

const MAX_DAYS = 1100; // ~3 an. Plis pase sa, nou limite pou pa chaje twòp done.
const CHUNK = 400; // kantite kòmand pa pipeline

export const INVESTMENT_SOURCES: InvestmentSource[] = ["personal", "loan", "partner", "other"];

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

function dateRange(start: string, end: string): string[] {
  const out: string[] = [];
  const cur = new Date(`${start}T00:00:00Z`);
  const last = new Date(`${end}T00:00:00Z`);
  while (cur <= last) {
    out.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

async function lrangeMany(keys: string[]): Promise<string[][]> {
  const out: string[][] = [];
  for (let i = 0; i < keys.length; i += CHUNK) {
    const pipe = redis.pipeline();
    for (const k of keys.slice(i, i + CHUNK)) pipe.lrange(k, 0, -1);
    out.push(...((await pipe.exec()) as string[][]));
  }
  return out;
}

async function hmgetChunked(keys: string[], fields: string[]) {
  const out: (Record<string, unknown> | null)[] = [];
  for (let i = 0; i < keys.length; i += CHUNK) {
    out.push(...(await hmgetMany(keys.slice(i, i + CHUNK), fields)));
  }
  return out;
}

export async function listInvestments(businessId: string): Promise<Investment[]> {
  const ids = await redis.lrange(`business:${businessId}:investments`, 0, -1);
  const rows = await hgetallMany<Investment>(ids.map((id) => `investment:${id}`));
  return rows
    .filter((r): r is Investment => !!r)
    .map((r) => ({ ...r, amount: num(r.amount) }))
    .sort((a, b) => (a.date === b.date ? (a.createdAt < b.createdAt ? 1 : -1) : a.date < b.date ? 1 : -1));
}

export async function listTransfers(businessId: string): Promise<Transfer[]> {
  const ids = await redis.lrange(`business:${businessId}:transfers`, 0, -1);
  const rows = await hgetallMany<Transfer>(ids.map((id) => `transfer:${id}`));
  return rows
    .filter((r): r is Transfer => !!r)
    .map((r) => ({ ...r, amount: num(r.amount) }))
    .sort((a, b) => (a.date === b.date ? (a.createdAt < b.createdAt ? 1 : -1) : a.date < b.date ? 1 : -1));
}

async function computeCapitalFresh(businessId: string, name?: string): Promise<CapitalSummary> {
  const today = new Date().toISOString().slice(0, 10);
  const [investments, transfers, business] = await Promise.all([
    listInvestments(businessId),
    listTransfers(businessId),
    redis.hgetall<Business>(`business:${businessId}`),
  ]);

  // Valè stok (a pri acha) — menm règ ak tablo debò a.
  const productIds = await redis.smembers(`business:${businessId}:products`);
  const products = await hgetallMany<Product>(productIds.map((id) => `product:${id}`));
  const stockValue = products
    .filter((p): p is Product => !!p && !["digital", "dish"].includes(String(p.productType)) && !(p.comingSoon === true))
    .reduce((sum, p) => sum + num(p.stock) * num(p.buyPrice), 0);

  const investedBySource: Record<InvestmentSource, number> = { personal: 0, loan: 0, partner: 0, other: 0 };
  let invested = 0;
  let cash = 0;
  let bank = 0;
  for (const inv of investments) {
    invested += inv.amount;
    investedBySource[inv.source] = (investedBySource[inv.source] ?? 0) + inv.amount;
    if (inv.destination === "bank") bank += inv.amount;
    else cash += inv.amount;
  }
  for (const tr of transfers) {
    if (tr.direction === "cash_to_bank") {
      cash -= tr.amount;
      bank += tr.amount;
    } else {
      bank -= tr.amount;
      cash += tr.amount;
    }
  }

  const flows = { salesCash: 0, salesBank: 0, expensesCash: 0, expensesBank: 0, refunds: 0 };
  let trackingStart: string | null = null;
  let truncated = false;

  {
    const createdDay = business?.createdAt ? String(business.createdAt).slice(0, 10) : "";
    const candidates = [...investments.map((i) => i.date), ...(/^\d{4}-\d{2}-\d{2}$/.test(createdDay) ? [createdDay] : [])];
    const earliest0 = new Date(Date.now() - MAX_DAYS * 86_400_000).toISOString().slice(0, 10);
    trackingStart = candidates.length ? candidates.reduce((min, d) => (d < min ? d : min)) : earliest0;
    let from = trackingStart;
    const earliest = new Date(Date.now() - MAX_DAYS * 86_400_000).toISOString().slice(0, 10);
    if (from < earliest) {
      from = earliest;
      truncated = true;
    }
    const days = dateRange(from, today);

    const [saleLists, expenseLists] = await Promise.all([
      lrangeMany(days.map((d) => `business:${businessId}:sales:${d}`)),
      lrangeMany(days.map((d) => `business:${businessId}:expenses:${d}`)),
    ]);
    const [sales, expenses] = await Promise.all([
      hmgetChunked(saleLists.flat().map((id) => `sale:${id}`), ["total", "paymentMethod"]),
      hmgetChunked(expenseLists.flat().map((id) => `expense:${id}`), ["amount", "source"]),
    ]);

    for (const s of sales) {
      if (!s) continue;
      const total = num(s.total);
      if (BANK_PAYMENT_METHODS.has(String(s.paymentMethod))) flows.salesBank += total;
      else flows.salesCash += total; // cash, mixed (pa gen detay), enkoni
    }
    for (const e of expenses) {
      if (!e) continue;
      const amount = num(e.amount);
      if (String(e.source) === "bank") flows.expensesBank += amount;
      else flows.expensesCash += amount; // ansyen depans san "source" = kes
    }

    // Retou (ranbousman kliyan) soti nan kes la, depi dat swivi a.
    const returnIds = await redis.lrange(`business:${businessId}:returns`, 0, -1);
    const returns = await hmgetChunked(returnIds.map((id) => `return:${id}`), ["refundAmount", "createdAt"]);
    for (const r of returns) {
      if (!r || !r.createdAt) continue;
      if (String(r.createdAt).slice(0, 10) >= trackingStart) flows.refunds += num(r.refundAmount);
    }

    cash += flows.salesCash - flows.expensesCash - flows.refunds;
    bank += flows.salesBank - flows.expensesBank;
  }

  const capital = cash + bank + stockValue;
  return {
    businessId,
    name,
    trackingStart,
    invested,
    investedBySource,
    cash,
    bank,
    stockValue,
    capital,
    gain: capital - invested,
    flows,
    ...(truncated ? { truncated } : {}),
  };
}

const CACHE_TTL = 90; // segonn — evite re-eskane tout istorik la a chak ouvèti paj

export function invalidateCapital(businessId: string) {
  return redis.del(`capitalcache:${businessId}`).catch(() => 0);
}

/** Kapital yon antrepriz (ak ti cache 90s pou pa gaspiye kòmand Redis). */
export async function computeCapital(businessId: string, name?: string): Promise<CapitalSummary> {
  const key = `capitalcache:${businessId}`;
  try {
    const hit = await redis.get<CapitalSummary>(key);
    if (hit && typeof hit === "object" && "capital" in hit) return { ...hit, name: name ?? hit.name };
  } catch {
    /* cache pa disponib → kalkile dirèkteman */
  }
  const fresh = await computeCapitalFresh(businessId, name);
  try {
    await redis.set(key, fresh, { ex: CACHE_TTL });
  } catch {
    /* sa pa grav */
  }
  return fresh;
}

export async function computeCapitalForBusinesses(
  businesses: Pick<Business, "id" | "name">[]
): Promise<{ businesses: CapitalSummary[]; total: Omit<CapitalSummary, "businessId" | "name" | "trackingStart" | "truncated"> }> {
  const list = await Promise.all(businesses.map((b) => computeCapital(b.id, b.name)));
  const total = list.reduce(
    (acc, c) => ({
      invested: acc.invested + c.invested,
      investedBySource: {
        personal: acc.investedBySource.personal + c.investedBySource.personal,
        loan: acc.investedBySource.loan + c.investedBySource.loan,
        partner: acc.investedBySource.partner + c.investedBySource.partner,
        other: acc.investedBySource.other + c.investedBySource.other,
      },
      cash: acc.cash + c.cash,
      bank: acc.bank + c.bank,
      stockValue: acc.stockValue + c.stockValue,
      capital: acc.capital + c.capital,
      gain: acc.gain + c.gain,
      flows: {
        salesCash: acc.flows.salesCash + c.flows.salesCash,
        salesBank: acc.flows.salesBank + c.flows.salesBank,
        expensesCash: acc.flows.expensesCash + c.flows.expensesCash,
        expensesBank: acc.flows.expensesBank + c.flows.expensesBank,
        refunds: acc.flows.refunds + c.flows.refunds,
      },
    }),
    {
      invested: 0,
      investedBySource: { personal: 0, loan: 0, partner: 0, other: 0 },
      cash: 0,
      bank: 0,
      stockValue: 0,
      capital: 0,
      gain: 0,
      flows: { salesCash: 0, salesBank: 0, expensesCash: 0, expensesBank: 0, refunds: 0 },
    }
  );
  return { businesses: list, total };
}
