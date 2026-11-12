// Lojik abònman itilizatè (kont prensipal la sèlman).
// Chak itilizatè peye yon abònman chak mwa. Jou peman an = jou kont lan te kreye a.
// `paidMonths` = konbyen mwa ki peye deja (1 pa defo = premye mwa a enkli).
// Pwochen dat peman = dat kreyasyon + paidMonths mwa.

const TZ = "America/Port-au-Prince";

export type BillingStatus = "paid" | "soon" | "due_today" | "overdue";

/** Dat (YYYY-MM-DD) nan fizo Ayiti. */
export function ymd(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: TZ });
}

export function addMonthsYmd(start: string, n: number): string {
  const [y, m, d] = start.split("-").map(Number);
  const total = m - 1 + n;
  const ny = y + Math.floor(total / 12);
  const nm = ((total % 12) + 12) % 12;
  const last = new Date(Date.UTC(ny, nm + 1, 0)).getUTCDate();
  return `${ny}-${String(nm + 1).padStart(2, "0")}-${String(Math.min(d, last)).padStart(2, "0")}`;
}

export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000);
}

export interface BillingInfo {
  createdYmd: string;
  nextDue: string;
  daysUntil: number; // negatif = an reta
  monthsOverdue: number; // konbyen mwa ki dwe deja (dat la rive epi poko peye)
  status: BillingStatus;
}

export const SOON_DAYS = 5;

export function billingInfo(createdAt: string, paidMonths: number, now: Date = new Date()): BillingInfo | null {
  const d = new Date(createdAt);
  if (!createdAt || isNaN(d.getTime())) return null;
  const createdYmd = ymd(d);
  const today = ymd(now);
  const paid = Math.max(0, Math.floor(paidMonths));

  const nextDue = addMonthsYmd(createdYmd, paid);
  let monthsOverdue = 0;
  for (let k = paid; k < paid + 600; k++) {
    if (addMonthsYmd(createdYmd, k) <= today) monthsOverdue++;
    else break;
  }
  const daysUntil = daysBetween(today, nextDue);
  let status: BillingStatus = "paid";
  if (monthsOverdue > 0) status = monthsOverdue === 1 && daysUntil === 0 ? "due_today" : "overdue";
  else if (daysUntil <= SOON_DAYS) status = "soon";
  return { createdYmd, nextDue, daysUntil, monthsOverdue, status };
}
