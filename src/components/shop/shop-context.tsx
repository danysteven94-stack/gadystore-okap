"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { PublicProduct, PublicShop } from "@/lib/shop";
import { SHOP_LANG_KEY, translateShop, type ShopLang } from "@/lib/shop-i18n";

export interface CartLine {
  key: string; // pwodwi oswa pwodwi|gwosè|koulè
  p: PublicProduct;
  qty: number;
  size: string;
  color: string;
}

/** Kle yon liy panye. San opsyon = jis ID pwodwi a (konpatib ak ansyen panye yo). */
export function cartKey(id: string, size?: string, color?: string) {
  return size || color ? `${id}|${size ?? ""}|${color ?? ""}` : id;
}
function splitKey(key: string) {
  const [id, size = "", color = ""] = key.split("|");
  return { id, size, color };
}

export interface PlacedRef {
  code: string;
  phone: string;
  total: number;
  at: string;
}

export interface CustomerInfo {
  name: string;
  phone: string;
  address: string;
}

export interface ShopAccount {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
}

export interface AccountOrder {
  code: string;
  total: number;
  fulfillment: string;
  deliveryMethod: string;
  createdAt: string;
  phone: string;
}

interface Ctx {
  shop: PublicShop;
  base: string;
  money: (n: number) => string;
  byId: Map<string, PublicProduct>;
  cart: Record<string, number>;
  cartLines: CartLine[];
  inCartOf: (productId: string) => number;
  itemCount: number;
  subtotal: number;
  setQty: (p: PublicProduct, qty: number) => void;
  setLine: (key: string, qty: number) => void;
  addToCart: (p: PublicProduct, qty?: number, opts?: { size?: string; color?: string }) => void;
  clearCart: () => void;
  wish: string[];
  toggleWish: (id: string) => void;
  recent: string[];
  pushRecent: (id: string) => void;
  orders: PlacedRef[];
  rememberOrder: (o: PlacedRef) => void;
  customer: CustomerInfo | null;
  rememberCustomer: (c: CustomerInfo) => void;
  account: ShopAccount | null;
  accountReady: boolean;
  accountOrders: AccountOrder[];
  setAccount: (a: ShopAccount | null) => void;
  refreshAccount: () => Promise<void>;
  logoutAccount: () => Promise<void>;
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;
  notifyFor: PublicProduct | null;
  setNotifyFor: (p: PublicProduct | null) => void;
  toast: string | null;
  showToast: (msg: string) => void;
  refresh: () => Promise<void>;
  lang: ShopLang;
  setLang: (l: ShopLang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const ShopCtx = createContext<Ctx | null>(null);

/** Tradiksyon boutik la: t("Tèks kreyòl", { valè }) → tèks nan lang kliyan an chwazi. */
export function useT() {
  return useShop().t;
}

export function useShop() {
  const c = useContext(ShopCtx);
  if (!c) throw new Error("useShop must be used inside <ShopProvider>");
  return c;
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore (mòd prive / kota plen) */
  }
}

export function ShopProvider({ initial, children }: { initial: PublicShop; children: React.ReactNode }) {
  const [shop, setShop] = useState(initial);
  const slug = shop.slug;
  const base = `/boutik/${slug}`;

  const [cart, setCart] = useState<Record<string, number>>({});
  const [wish, setWish] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [orders, setOrders] = useState<PlacedRef[]>([]);
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  const [account, setAccountState] = useState<ShopAccount | null>(null);
  const [accountReady, setAccountReady] = useState(false);
  const [accountOrders, setAccountOrders] = useState<AccountOrder[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [notifyFor, setNotifyFor] = useState<PublicProduct | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Lang kliyan an (sove sou aparèy la, pou tout boutik)
  const [lang, setLangState] = useState<ShopLang>("ht");
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SHOP_LANG_KEY);
      if (saved === "ht" || saved === "fr" || saved === "en") setLangState(saved);
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const setLang = useCallback((l: ShopLang) => {
    setLangState(l);
    try {
      localStorage.setItem(SHOP_LANG_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);
  const t = useCallback((key: string, vars?: Record<string, string | number>) => translateShop(lang, key, vars), [lang]);

  // Chaje sa ki sove sou aparèy la (apre premye rann pou evite erè idratasyon)
  useEffect(() => {
    setCart(read(`cart:${slug}`, {}));
    setWish(read(`wish:${slug}`, []));
    setRecent(read(`recent:${slug}`, []));
    setOrders(read(`orders:${slug}`, []));
    setCustomer(read(`cust:${slug}`, null));
  }, [slug]);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/shop/${slug}`, { cache: "no-store" });
      if (res.ok) setShop((await res.json()).shop);
    } catch {
      /* ignore */
    }
  }, [slug]);

  useEffect(() => {
    const onVis = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [refresh]);

  const byId = useMemo(() => new Map(shop.products.map((p) => [p.id, p])), [shop.products]);

  // Liy valid sèlman: pwodwi a toujou la, gen stok, opsyon yo toujou egziste, epi
  // total tout varyant yon pwodwi pa depase stok la.
  const cartLines = useMemo<CartLine[]>(() => {
    const left = new Map<string, number>();
    const out: CartLine[] = [];
    for (const [key, qty] of Object.entries(cart)) {
      const { id, size, color } = splitKey(key);
      const p = byId.get(id);
      if (!p || p.stock <= 0 || qty <= 0) continue;
      if (p.sizes.length ? !p.sizes.includes(size) : !!size) continue;
      if (p.colors.length ? !p.colors.includes(color) : !!color) continue;
      const remaining = left.get(id) ?? p.stock;
      const q = Math.min(qty, remaining);
      if (q <= 0) continue;
      left.set(id, remaining - q);
      out.push({ key, p, qty: q, size, color });
    }
    return out;
  }, [cart, byId]);
  const inCartOf = useCallback(
    (productId: string) => cartLines.filter((l) => l.p.id === productId).reduce((s, l) => s + l.qty, 0),
    [cartLines]
  );
  const itemCount = cartLines.reduce((s, l) => s + l.qty, 0);
  const subtotal = cartLines.reduce((s, l) => s + l.qty * l.p.price, 0);

  const money = useCallback(
    (n: number) => `${shop.currency} ${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`,
    [shop.currency]
  );

  const persistCart = useCallback(
    (next: Record<string, number>) => {
      setCart(next);
      write(`cart:${slug}`, next);
    },
    [slug]
  );

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  const setLine = useCallback(
    (key: string, qty: number) => {
      const { id } = splitKey(key);
      const p = byId.get(id);
      if (!p) return;
      const others = cartLines.filter((l) => l.p.id === id && l.key !== key).reduce((s, l) => s + l.qty, 0);
      const q = Math.max(0, Math.min(Math.floor(qty) || 0, p.stock - others));
      const next = { ...cart };
      if (q === 0) delete next[key];
      else next[key] = q;
      persistCart(next);
    },
    [cart, cartLines, byId, persistCart]
  );

  const setQty = useCallback((p: PublicProduct, qty: number) => setLine(p.id, qty), [setLine]);

  const addToCart = useCallback(
    (p: PublicProduct, qty = 1, opts?: { size?: string; color?: string }) => {
      if (p.stock <= 0) return;
      const room = p.stock - inCartOf(p.id);
      if (room <= 0) {
        showToast("Ou rive nan stok ki disponib la.");
        return;
      }
      const key = cartKey(p.id, opts?.size, opts?.color);
      persistCart({ ...cart, [key]: (cart[key] ?? 0) + Math.min(qty, room) });
      showToast("Ajoute nan panye ✓");
    },
    [cart, inCartOf, persistCart, showToast]
  );

  const clearCart = useCallback(() => persistCart({}), [persistCart]);

  const toggleWish = useCallback(
    (id: string) => {
      setWish((cur) => {
        const next = cur.includes(id) ? cur.filter((x) => x !== id) : [id, ...cur];
        write(`wish:${slug}`, next);
        return next;
      });
    },
    [slug]
  );

  const pushRecent = useCallback(
    (id: string) => {
      setRecent((cur) => {
        if (cur[0] === id) return cur;
        const next = [id, ...cur.filter((x) => x !== id)].slice(0, 12);
        write(`recent:${slug}`, next);
        return next;
      });
    },
    [slug]
  );

  const rememberOrder = useCallback(
    (o: PlacedRef) => {
      setOrders((cur) => {
        const next = [o, ...cur.filter((x) => x.code !== o.code)].slice(0, 20);
        write(`orders:${slug}`, next);
        return next;
      });
    },
    [slug]
  );

  const rememberCustomer = useCallback(
    (c: CustomerInfo) => {
      setCustomer(c);
      write(`cust:${slug}`, c);
    },
    [slug]
  );

  // Kont kliyan an (cookie httpOnly): mande sèvè a kiyès ki konekte
  const setAccount = useCallback(
    (a: ShopAccount | null) => {
      setAccountState(a);
      // Konekte = ranpli checkout la otomatikman ak enfòmasyon kont lan
      if (a) rememberCustomer({ name: a.name, phone: a.phone, address: a.address });
      else setAccountOrders([]);
    },
    [rememberCustomer]
  );

  const refreshAccount = useCallback(async () => {
    try {
      const res = await fetch(`/api/shop/${slug}/account/me`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setAccount(data.customer ?? null);
        setAccountOrders(data.orders ?? []);
      }
    } catch {
      /* offline: kenbe sa nou genyen */
    } finally {
      setAccountReady(true);
    }
  }, [slug, setAccount]);

  const logoutAccount = useCallback(async () => {
    try {
      await fetch(`/api/shop/${slug}/account/logout`, { method: "POST" });
    } catch {
      /* ignore */
    }
    setAccount(null);
  }, [slug, setAccount]);

  useEffect(() => {
    refreshAccount();
  }, [refreshAccount]);

  const value: Ctx = {
    shop,
    base,
    money,
    byId,
    cart,
    cartLines,
    inCartOf,
    itemCount,
    subtotal,
    setQty,
    setLine,
    addToCart,
    clearCart,
    wish,
    toggleWish,
    recent,
    pushRecent,
    orders,
    rememberOrder,
    customer,
    rememberCustomer,
    account,
    accountReady,
    accountOrders,
    setAccount,
    refreshAccount,
    logoutAccount,
    cartOpen,
    setCartOpen,
    notifyFor,
    setNotifyFor,
    toast,
    showToast,
    refresh,
    lang,
    setLang,
    t,
  };

  return <ShopCtx.Provider value={value}>{children}</ShopCtx.Provider>;
}
