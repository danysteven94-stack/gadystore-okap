// Pati PI (san Redis) jounal odit la: sanitizasyon, diff, filtraj. Fasil pou teste.

export type AuditAction =
  | "auth.login" | "auth.login_failed" | "auth.password_changed" | "auth.password_reset"
  | "auth.2fa_enabled" | "auth.2fa_disabled"
  | "user.create" | "user.delete" | "user.deactivate" | "user.activate"
  | "user.reset_password" | "user.set_businesses" | "user.set_plan"
  | "product.create" | "product.update" | "product.delete"
  | "inventory.adjust" | "return.create"
  | "order.cancel" | "order.fulfillment" | "order.payment"
  | "backup.restore"
  | "billing.pay" | "billing.undo" | "billing.set_price";

export interface AuditEntry {
  id: string;
  at: string; // ISO
  actor: string; // imèl (oswa "anonim")
  role?: string;
  action: AuditAction;
  businessId?: string;
  target?: { type: string; id?: string; label?: string };
  meta?: Record<string, unknown>;
  ip?: string;
  ua?: string;
}

const SECRET_KEY = /pass|token|secret|hash|otp|code|cookie|authorization/i;
const MAX_STR = 200;
const MAX_META_JSON = 1500;

/** Retire sekrè yo, kout chèn yo, limite pwofondè. Pa janm kite yon modpas/token antre nan jounal la. */
export function sanitizeMeta(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return value.length > MAX_STR ? `${value.slice(0, MAX_STR)}…` : value;
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (depth >= 3) return "[…]";
  if (Array.isArray(value)) return value.slice(0, 20).map((v) => sanitizeMeta(v, depth + 1));
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (SECRET_KEY.test(k)) continue;
      out[k] = sanitizeMeta(v, depth + 1);
    }
    return out;
  }
  return String(value);
}

export function buildMeta(meta: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!meta) return undefined;
  const clean = sanitizeMeta(meta) as Record<string, unknown>;
  if (Object.keys(clean).length === 0) return undefined;
  return JSON.stringify(clean).length > MAX_META_JSON ? { truncated: true } : clean;
}

/** Sèlman chan ki chanje, nan fòm { chan: { from, to } }. */
export function diffFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  fields: string[]
): Record<string, { from: unknown; to: unknown }> {
  const out: Record<string, { from: unknown; to: unknown }> = {};
  for (const f of fields) {
    if (!(f in after)) continue;
    const a = before[f];
    const b = after[f];
    if (String(a ?? "") !== String(b ?? "")) out[f] = { from: a ?? null, to: b ?? null };
  }
  return out;
}

/** Premye IP nan x-forwarded-for (Vercel), limite epi valide fòma a. */
export function clientIp(xff: string | null, realIp?: string | null): string | undefined {
  const raw = (xff?.split(",")[0] ?? realIp ?? "").trim();
  return /^[0-9a-fA-F:.]{3,45}$/.test(raw) ? raw : undefined;
}

export function parseEntries(raw: unknown[]): AuditEntry[] {
  const out: AuditEntry[] = [];
  for (const r of raw) {
    try {
      const e = typeof r === "string" ? JSON.parse(r) : r;
      if (e && typeof e === "object" && typeof (e as AuditEntry).id === "string" && typeof (e as AuditEntry).action === "string") {
        out.push(e as AuditEntry);
      }
    } catch {
      /* antre kòwonpi: sote */
    }
  }
  return out;
}

export interface AuditFilter {
  action?: string; // egzak, oswa prefiks "user." / "auth."
  actor?: string; // sou-chèn imèl
  q?: string; // rechèch lib nan label/target/ip
  from?: string; // YYYY-MM-DD
  to?: string;
}

export function filterEntries(entries: AuditEntry[], f: AuditFilter): AuditEntry[] {
  const q = f.q?.trim().toLowerCase();
  const actor = f.actor?.trim().toLowerCase();
  return entries.filter((e) => {
    if (f.action && !(e.action === f.action || (f.action.endsWith(".") && e.action.startsWith(f.action)))) return false;
    if (actor && !e.actor.toLowerCase().includes(actor)) return false;
    if (f.from && e.at.slice(0, 10) < f.from) return false;
    if (f.to && e.at.slice(0, 10) > f.to) return false;
    if (q) {
      const hay = `${e.target?.label ?? ""} ${e.target?.id ?? ""} ${e.ip ?? ""} ${e.actor}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}
