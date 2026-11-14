// Tan livrezon an jou (entèval). min/max = 0 vle di "pa defini".
// `t` (opsyonèl) = fonksyon tradiksyon boutik la.
type T = (key: string, vars?: Record<string, string | number>) => string;
const plain: T = (key, vars) => key.replace(/\{(\w+)\}/g, (m, n: string) => (vars && n in vars ? String(vars[n]) : m));

export function deliveryEta(min: number, max: number, t: T = plain): string | null {
  const a = Math.max(0, Math.floor(min || 0));
  const b = Math.max(0, Math.floor(max || 0));
  if (!a && !b) return null;
  const hi = Math.max(a, b);
  const lo = a && b ? Math.min(a, b) : 0;
  if (!lo) return t("Jiska {n} jou", { n: hi });
  if (lo === hi) return t("{n} jou", { n: hi });
  return t("{lo} a {hi} jou", { lo, hi });
}

/** Pareil, men pran min/max dirèkteman nan boutik la (tolerans si chan yo pa la). */
export function shopEta(shop: object, t?: T): string | null {
  const s = shop as { deliveryMinDays?: number; deliveryMaxDays?: number };
  return deliveryEta(s.deliveryMinDays ?? 0, s.deliveryMaxDays ?? 0, t);
}
