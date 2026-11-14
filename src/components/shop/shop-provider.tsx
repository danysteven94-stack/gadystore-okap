"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { PublicProduct, PublicShop } from "@/lib/shop";
import { lineKey, parseLineKey } from "@/lib/shop-utils";

export interface CartLine {
  key: string;
  p: PublicProduct;
  qty: number;
  size: string;
  color: string;
}

export interface MyOrder {
  code: string;
  phone: string;
  at: string;
}

interface ShopCtx {
  shop: PublicShop;
  base: string;
  money: (n: number) => string;
  byId: Map<string, PublicProduct>;
  hydrated: boolean;
  // panye
  cartLines: CartLine[];
  itemCount: number;
  subtotal: number;
  qtyInCart: (productId: string) => number;
  addToCart: (p: PublicProduct, qty?: number, opts?: { size?: string; color?: string }) => boolean;
  setLineQty: (key: string, qty: number) => void;
  removeLine: (key: string) => void;
  clearCart: () => void;
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;
  // lis anvi
  wishlist: string[];
  toggleWish: (id: string) => void;
  // dènye pwodwi wè
  recent: string[];
  pushRecent: (id: string) => void;
  // kòmand mwen yo
  myOrders: MyOrder[];
  rememberOrder: (code: string, phone: string) => void;
  toast: string | null;
  showToast: (msg: string) => void;
  refresh: () => Promise<void>;
}

const Ctx = createContext<ShopCtx | null>(null);

export function useShop() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useShop dwe itilize anndan ShopProvider.");
  return c;
}

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function ShopProvider({ initial, children }: { initial: PublicShop; children: React.ReactNode }) {
  const [shop, setShop] = useState(initial);
  const slug = shop.slug;
  const base = `/boutik/${slug}`;

  const [hydrated, setHydrated] = useState(false);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [myOrders, setMyOrders] = useState<MyOrder[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const kCart = `cart2:${slug}`;
  const kWish = `wish:${slug}`;
  const kRecent = `recent:${slug}`;
  const kOrders = `orders:${slug}`;

  useEffect(() => {
    let c = readJSON<Record<string, number>>(kCart, {});
    // Ansyen panye (pwodwi -> kantite) vin nouvo fòma a
    const old = readJSON<Record<string, number>>(`cart:${slug}`, {});
    if (Object.keys(old).length && !Object.keys(c).length) {
      c = Object.fromEntries(Object.entries(old).map(([id, q]) => [lineKey(id), q]));
      writeJSON(kCart, c);
    }
    setCart(c);
    setWishlist(readJSON<string[]>(kWish, []));
    setRecent(readJSON<string[]>(kRecent, []));
    setMyOrders(readJSON<MyOrder[]>(kOrders, []));
    setHydrated(true);
  }, [kCart, kWish, kRecent, kOrders, slug]);

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

  // Liy panye valid: pwodwi a toujou la, gen stok, epi total pa depase stok la
  const cartLines = useMemo<CartLine[]>(() => {
    const left = new Map<string, number>();
    const out: CartLine[] = [];
    for (const [key, qty] of Object.entries(cart)) {
      const { productId, size, color } = parseLineKey(key);
      const p = byId.get(productId);
      if (!p || p.stock <= 0 || qty <= 0) continue;
      const remaining = left.get(productId) ?? p.stock;
      const q = Math.min(qty, remaining);
      if (q <= 0) continue;
      left.set(productId, remaining - q);
      out.push({ key, p, qty: q, size, color });
    }
    return out;
  }, [cart, byId]);

  const itemCount = cartLines.reduce((s, l) => s + l.qty, 0);
  const subtotal = cartLines.reduce((s, l) => s + l.qty * l.p.price, 0);

  const money = useCallback(
    (n: number) => `${shop.currency} ${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`,
    [shop.currency]
  );

  const saveCart = useCallback(
    (next: Record<string, number>) => {
      setCart(next);
      writeJSON(kCart, next);
    },
    [kCart]
  );

  const qtyInCart = useCallback(
    (productId: string) => cartLines.filter((l) => l.p.id === productId).reduce((s, l) => s + l.qty, 0),
    [cartLines]
  );

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const addToCart = useCallback<ShopCtx["addToCart"]>(
    (p, qty = 1, opts) => {
      if (p.stock <= 0) return false;
      const key = lineKey(p.id, opts?.size, opts?.color);
      const inCartTotal = qtyInCart(p.id);
      const room = p.stock - inCartTotal;
      if (room <= 0) {
        showToast("Ou deja gen tout stok ki disponib nan panye a.");
        return false;
      }
      const add = Math.min(qty, room);
      saveCart({ ...cart, [key]: (cart[key] ?? 0) + add });
      if (add < qty) showToast(`Sèlman ${add} ajoute — se tout stok ki rete a.`);
      return true;
    },
    [cart, qtyInCart, saveCart, showToast]
  );

  const setLineQty = useCallback(
    (key: string, qty: number) => {
      const next = { ...cart };
      const { productId } = parseLineKey(key);
      const p = byId.get(productId);
      if (!p) return;
      const others = cartLines.filter((l) => l.p.id === productId && l.key !== key).reduce((s, l) => s + l.qty, 0);
      const q = Math.max(0, Math.min(qty, p.stock - others));
      if (q === 0) delete next[key];
      else next[key] = q;
      saveCart(next);
    },
    [cart, byId, cartLines, saveCart]
  );

  const removeLine = useCallback((key: string) => setLineQty(key, 0), [setLineQty]);
  const clearCart = useCallback(() => saveCart({}), [saveCart]);

  const toggleWish = useCallback(
    (id: string) => {
      setWishlist((w) => {
        const next = w.includes(id) ? w.filter((x) => x !== id) : [id, ...w];
        writeJSON(kWish, next);
        return next;
      });
    },
    [kWish]
  );

  const pushRecent = useCallback(
    (id: string) => {
      setRecent((r) => {
        if (r[0] === id) return r;
        const next = [id, ...r.filter((x) => x !== id)].slice(0, 12);
        writeJSON(kRecent, next);
        return next;
      });
    },
    [kRecent]
  );

  const rememberOrder = useCallback(
    (code: string, phone: string) => {
      setMyOrders((o) => {
        const next = [{ code, phone, at: new Date().toISOString() }, ...o.filter((x) => x.code !== code)].slice(0, 10);
        writeJSON(kOrders, next);
        return next;
      });
    },
    [kOrders]
  );

  const value: ShopCtx = {
    shop,
    base,
    money,
    byId,
    hydrated,
    cartLines,
    itemCount,
    subtotal,
    qtyInCart,
    addToCart,
    setLineQty,
    removeLine,
    clearCart,
    cartOpen,
    setCartOpen,
    wishlist,
    toggleWish,
    recent,
    pushRecent,
    myOrders,
    rememberOrder,
    toast,
    showToast,
    refresh,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
