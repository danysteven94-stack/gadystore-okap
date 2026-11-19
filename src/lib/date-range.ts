// Dat YYYY-MM-DD an UTC (pa gen pwoblèm fizo orè ete/ivè sou sèvè a).
const YMD = /^\d{4}-\d{2}-\d{2}$/;
const DAY = 86_400_000;

export function isYmd(s: unknown): s is string {
  if (typeof s !== "string" || !YMD.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s; // rejte 2026-02-31
}

export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY) + 1;
}

export function eachDate(from: string, to: string): string[] {
  const out: string[] = [];
  for (let t = Date.parse(`${from}T00:00:00Z`), end = Date.parse(`${to}T00:00:00Z`); t <= end; t += DAY) {
    out.push(new Date(t).toISOString().slice(0, 10));
  }
  return out;
}

/** Retounen yon mesaj erè (kreyòl) oswa null si entèval la bon. Limite pou yon itilizatè pa ka mande 100 ane done. */
export function validateRange(from: unknown, to: unknown, maxDays = 366): string | null {
  if (!isYmd(from) || !isYmd(to)) return "Dat yo dwe nan fòma AAAA-MM-JJ.";
  if (from > to) return "Dat depa a dwe anvan dat fen an.";
  if (daysBetween(from, to) > maxDays) return `Entèval la two long (maksimòm ${maxDays} jou).`;
  return null;
}
