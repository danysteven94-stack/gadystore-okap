import { idbAll, idbClear, idbDelete, idbGet, idbPut } from "./idb";
import { NAV_ITEMS } from "@/lib/nav-items";

/**
 * Kouch offline: ranplase window.fetch pou apèl /api/* menm orijin.
 *  - GET: rezo an premye, sove repons lan nan IndexedDB; si pa gen rezo → sèvi dènye kopi a.
 *  - POST /api/sales | expenses | purchases | customers: si pa gen rezo → mete nan yon fil
 *    (queue) epi voye l otomatikman lè entènèt retounen (ak X-Idempotency-Key pou evite doub).
 *  - Lòt modifikasyon: mande entènèt (pou evite konfli done).
 */

export interface QueueItem {
  id: string;
  url: string;
  method: string;
  body: string;
  createdAt: string;
  label: string;
  failed?: boolean;
  error?: string;
}
export interface OfflineState {
  online: boolean;
  pending: number;
  failed: QueueItem[];
  syncing: boolean;
}

let state: OfflineState = {
  online: typeof navigator === "undefined" ? true : navigator.onLine,
  pending: 0,
  failed: [],
  syncing: false,
};
const listeners = new Set<(s: OfflineState) => void>();
export const getState = () => state;
export function subscribe(fn: (s: OfflineState) => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function setState(patch: Partial<OfflineState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l(state));
}
export const setOnline = (online: boolean) => state.online !== online && setState({ online });

const QUEUEABLE = new Set(["/api/sales", "/api/expenses", "/api/purchases", "/api/customers"]);
const BYPASS =
  /^\/api\/(auth\/(login|logout|change-password|delete-account)|invoices|backup|img|users|user-billing|push|shop\/(?!settings))/;

let realFetch: typeof fetch;
let installed = false;

const json = (data: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", ...extra } });

export async function refreshCounts() {
  try {
    const all = await idbAll<QueueItem>("queue");
    setState({ pending: all.filter((i) => !i.failed).length, failed: all.filter((i) => i.failed) });
  } catch {
    /* IndexedDB pa disponib */
  }
}
export async function getPendingCount() {
  await refreshCounts();
  return state.pending + state.failed.length;
}
export async function clearOfflineData() {
  await idbClear("cache").catch(() => {});
  await idbClear("queue").catch(() => {});
  await refreshCounts();
  try { localStorage.removeItem("offline:warmup"); } catch {}
}
export async function discardFailed(id: string) {
  await idbDelete("queue", id);
  await refreshCounts();
}

function withTimeout(ms: number) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return { signal: ctrl.signal, done: () => clearTimeout(t) };
}

async function handleGet(url: URL, input: RequestInfo | URL, init?: RequestInit) {
  const key = url.pathname + url.search;
  const to = withTimeout(12000);
  try {
    const res = await realFetch(input, { ...init, signal: to.signal });
    to.done();
    setOnline(true);
    if (res.ok && (res.headers.get("content-type") || "").includes("application/json")) {
      res.clone().text().then((body) => idbPut("cache", { key, body, savedAt: Date.now() })).catch(() => {});
    }
    return res;
  } catch {
    to.done();
    setOnline(navigator.onLine);
    const hit = await idbGet<{ body: string }>("cache", key).catch(() => undefined);
    if (hit) return new Response(hit.body, { status: 200, headers: { "Content-Type": "application/json", "X-Offline-Cache": "1" } });
    return json({ error: "Pa gen koneksyon, e done sa a poko sove sou telefòn nan." }, 503);
  }
}

// --- Mizajou lokal kach la (pou ekran yo montre chanjman an menm tan, offline) ---
async function patchCache(prefix: string, fn: (data: Record<string, unknown>) => void) {
  const all = await idbAll<{ key: string; body: string }>("cache").catch(() => []);
  for (const row of all) {
    if (!row.key.startsWith(prefix)) continue;
    try {
      const data = JSON.parse(row.body);
      fn(data);
      await idbPut("cache", { ...row, body: JSON.stringify(data) });
    } catch {}
  }
}
async function adjustStock(businessId: string, items: { productId: string; qty: number }[], sign: 1 | -1) {
  await patchCache(`/api/products?businessId=${businessId}`, (d) => {
    const products = (d.products as { id: string; stock: number; minStock: number }[]) || [];
    for (const it of items) {
      const p = products.find((x) => x && x.id === it.productId);
      if (p) p.stock = Number(p.stock) + sign * it.qty;
    }
    d.lowStock = products.filter((p) => p && p.stock <= p.minStock);
  });
}

async function enqueueAndFake(path: string, rawBody: string, id: string) {
  const b = JSON.parse(rawBody);
  const createdAt = new Date().toISOString();
  let label = "Operasyon";
  let fake: Record<string, unknown>;

  if (path === "/api/sales") {
    label = "Vant";
    const items = b.items as { productId: string; qty: number; unitPrice: number }[];
    const subtotal = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
    const discount = Number(b.discount) || 0;
    const tax = ((subtotal - discount) * (Number(b.taxRate) || 0)) / 100;
    fake = { sale: { id, ...b, subtotal, discount, tax, total: subtotal - discount + tax, createdAt, offline: true }, queued: true };
    b.createdAt = createdAt;
    await adjustStock(b.businessId, items, -1);
  } else if (path === "/api/expenses") {
    label = "Depans";
    fake = { expense: { id, ...b, createdAt, offline: true }, queued: true };
    b.createdAt = createdAt;
    await patchCache(`/api/expenses?businessId=${b.businessId}`, (d) => {
      (d.expenses as unknown[]).unshift({ id, ...b, createdAt });
      d.total = Number(d.total || 0) + Number(b.amount || 0);
    });
  } else if (path === "/api/purchases") {
    label = "Acha";
    fake = { purchase: { id, ...b, createdAt, offline: true }, queued: true };
    await adjustStock(b.businessId, b.items, 1);
  } else {
    label = "Kliyan";
    fake = { customer: { id, ...b, createdAt, offline: true }, queued: true };
    await patchCache(`/api/customers?businessId=${b.businessId}`, (d) => {
      (d.customers as unknown[]).unshift({ id, ...b, createdAt });
    });
  }

  await idbPut("queue", { id, url: path, method: "POST", body: JSON.stringify(b), createdAt, label } satisfies QueueItem);
  await refreshCounts();
  return json(fake, 201, { "X-Offline-Queued": "1" });
}

async function readBody(input: RequestInfo | URL, init?: RequestInit): Promise<string | undefined> {
  if (typeof init?.body === "string") return init.body;
  if (input instanceof Request) return input.clone().text();
  return undefined;
}

async function handleMutation(url: URL, method: string, input: RequestInfo | URL, init?: RequestInit) {
  const queueable = method === "POST" && QUEUEABLE.has(url.pathname);
  if (!queueable) {
    try {
      const res = await realFetch(input, init);
      setOnline(true);
      return res;
    } catch {
      setOnline(navigator.onLine);
      return json({ error: "Fonksyon sa a mande entènèt. Konekte epi eseye ankò." }, 503);
    }
  }

  const body = (await readBody(input, init)) ?? "{}";
  const id = crypto.randomUUID();
  const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
  headers.set("Content-Type", "application/json");
  headers.set("X-Idempotency-Key", id);
  const to = withTimeout(15000);
  try {
    const res = await realFetch(url.pathname + url.search, { method, headers, body, credentials: "same-origin", signal: to.signal });
    to.done();
    setOnline(true);
    return res;
  } catch {
    to.done();
    setOnline(navigator.onLine);
    return enqueueAndFake(url.pathname, body, id);
  }
}

export function installOfflineFetch() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  realFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    let url: URL;
    try {
      url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url, location.href);
    } catch {
      return realFetch(input, init);
    }
    if (url.origin !== location.origin || !url.pathname.startsWith("/api/") || BYPASS.test(url.pathname)) {
      return realFetch(input, init);
    }
    const method = (init?.method || (input instanceof Request ? input.method : "GET")).toUpperCase();
    return method === "GET" ? handleGet(url, input, init) : handleMutation(url, method, input, init);
  };
}

let syncing = false;
export async function syncQueue() {
  if (syncing || typeof navigator === "undefined" || !navigator.onLine || !realFetch) return;
  syncing = true;
  setState({ syncing: true });
  let sent = 0;
  try {
    const items = (await idbAll<QueueItem>("queue")).filter((i) => !i.failed).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    for (const it of items) {
      let res: Response;
      try {
        res = await realFetch(it.url, {
          method: it.method,
          headers: { "Content-Type": "application/json", "X-Idempotency-Key": it.id },
          body: it.body,
          credentials: "same-origin",
        });
      } catch {
        break; // pa gen rezo ankò — eseye pita
      }
      if (res.ok) {
        await idbDelete("queue", it.id);
        sent++;
        continue;
      }
      if (res.status === 401 || res.status >= 500) break; // sesyon ekspire / sèvè an pàn — eseye pita
      let msg = "";
      try { const d = await res.json(); msg = typeof d.error === "string" ? d.error : ""; } catch {}
      await idbPut("queue", { ...it, failed: true, error: msg || `Kòd ${res.status}` });
    }
  } finally {
    syncing = false;
    setState({ syncing: false });
    await refreshCounts();
    if (sent > 0) window.dispatchEvent(new CustomEvent("offline:synced"));
  }
}

/** Chaje done yo davans pou yo disponib offline (1 fwa chak 6 èdtan, sèlman si gen entènèt). */
export async function warmup(force = false) {
  if (typeof navigator === "undefined" || !navigator.onLine) return;
  try {
    const last = Number(localStorage.getItem("offline:warmup") || 0);
    if (!force && Date.now() - last < 6 * 3600_000) return;
  } catch {}

  const bizRes = await fetch("/api/businesses").catch(() => null);
  if (!bizRes || !bizRes.ok) return; // pa konekte ankò
  const data = await bizRes.json().catch(() => ({}));
  const list: { id: string }[] = Array.isArray(data) ? data : data.businesses || [];

  const urls = ["/api/auth/me", "/api/notifications", "/api/shop/settings"];
  for (const b of list) {
    for (const p of ["products", "customers", "suppliers", "expenses", "orders", "returns", "inventory", "purchases", "subscriptions", "dashboard", "reports/stock"]) {
      urls.push(`/api/${p}?businessId=${b.id}`);
    }
  }
  const queue = [...urls];
  await Promise.all(
    Array.from({ length: 3 }, async () => {
      while (queue.length) {
        const u = queue.shift()!;
        await fetch(u).catch(() => {});
      }
    })
  );

  // Paj yo (pou service worker kenbe yo)
  for (const item of NAV_ITEMS) {
    await realFetch(item.href, { headers: { Accept: "text/html" } }).catch(() => {});
  }
  try { localStorage.setItem("offline:warmup", String(Date.now())); } catch {}
}
