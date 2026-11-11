"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, Check, Loader2, MessageCircle, Minus, Plus, Search, ShoppingBag, Trash2, X } from "lucide-react";
import type { PublicProduct, PublicShop } from "@/lib/shop";

const GREEN = "#4f7f52";
const GREEN_DARK = "#2f5a37";
const CREAM = "#f6efdc";
const CARD = "#faf5e6";
const BORDER = "#e3d9b8";
const BRICK = "#9b3b32";

// Fon kare pastèl tankou referans lan
const PLAID: React.CSSProperties = {
  backgroundColor: CREAM,
  backgroundImage:
    "repeating-linear-gradient(0deg, rgba(190,110,100,.13) 0 46px, transparent 46px 92px), repeating-linear-gradient(90deg, rgba(120,130,125,.16) 0 46px, transparent 46px 92px)",
};

type PayMethod = "cash_delivery" | "moncash" | "natcash" | "transfer";
const PAY_OPTIONS: { id: PayMethod; label: string }[] = [
  { id: "cash_delivery", label: "Kach lè m resevwa" },
  { id: "moncash", label: "MonCash" },
  { id: "natcash", label: "NatCash" },
  { id: "transfer", label: "Transfè bank" },
];

interface Placed {
  code: string;
  total: number;
  paymentLabel: string;
  lines: { name: string; qty: number; unitPrice: number; unit: string }[];
  customerName: string;
  phone: string;
  address: string;
  payment: PayMethod;
}

export function Storefront({ initial }: { initial: PublicShop }) {
  const [shop, setShop] = useState(initial);
  const [tab, setTab] = useState<"catalog" | "cart">("catalog");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [notifyFor, setNotifyFor] = useState<PublicProduct | null>(null);
  const [placed, setPlaced] = useState<Placed | null>(null);

  const cartKey = `cart:${shop.slug}`;

  // Panye a rete menm si kliyan an fèmen paj la
  useEffect(() => {
    try {
      const saved = localStorage.getItem(cartKey);
      if (saved) setCart(JSON.parse(saved));
    } catch {
      /* ignore */
    }
  }, [cartKey]);

  const persist = useCallback(
    (next: Record<string, number>) => {
      setCart(next);
      try {
        localStorage.setItem(cartKey, JSON.stringify(next));
      } catch {
        /* ignore */
      }
    },
    [cartKey]
  );

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/shop/${shop.slug}`, { cache: "no-store" });
      if (res.ok) setShop((await res.json()).shop);
    } catch {
      /* ignore */
    }
  }, [shop.slug]);

  // Rechaje stok la lè kliyan an retounen sou paj la
  useEffect(() => {
    const onVis = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [refresh]);

  const byId = useMemo(() => new Map(shop.products.map((p) => [p.id, p])), [shop.products]);

  // Netwaye panye a: retire sa ki pa egziste ankò, limite a stok la
  const cartLines = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => ({ p: byId.get(id), qty }))
        .filter((l): l is { p: PublicProduct; qty: number } => !!l.p && l.p.stock > 0 && l.qty > 0)
        .map((l) => ({ p: l.p, qty: Math.min(l.qty, l.p.stock) })),
    [cart, byId]
  );
  const itemCount = cartLines.reduce((s, l) => s + l.qty, 0);
  const total = cartLines.reduce((s, l) => s + l.qty * l.p.price, 0);

  const money = (n: number) => `${shop.currency} ${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

  function setQty(p: PublicProduct, qty: number) {
    const q = Math.max(0, Math.min(qty, p.stock));
    const next = { ...cart };
    if (q === 0) delete next[p.id];
    else next[p.id] = q;
    persist(next);
  }

  const categories = useMemo(() => [...new Set(shop.products.map((p) => p.category))], [shop.products]);
  const filtered = shop.products.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) && (!category || p.category === category)
  );

  const font = { fontFamily: "var(--font-display), serif" };

  return (
    <div className="min-h-screen text-[#1f2a1f]" style={PLAID}>
      {/* Header */}
      <header style={{ background: GREEN }} className="text-center text-white px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-6">
        <h1 style={font} className="text-3xl font-semibold leading-tight">{shop.name}</h1>
        <p className="mt-1 text-[11px] tracking-[0.3em] uppercase font-mono opacity-90">{shop.tagline}</p>
      </header>

      {/* Tabs */}
      <nav className="grid grid-cols-2 sticky top-0 z-30 border-b" style={{ background: CREAM, borderColor: BORDER }}>
        {([
          ["catalog", "Katalòg", ShoppingBag],
          ["cart", `Panye${itemCount ? ` (${itemCount})` : ""}`, null],
        ] as const).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="py-3.5 text-base font-semibold flex items-center justify-center gap-2 border-b-4"
            style={{
              color: tab === id ? GREEN_DARK : "#6b6b55",
              borderColor: tab === id ? GREEN_DARK : "transparent",
            }}
          >
            {Icon && <Icon size={18} />} {label}
          </button>
        ))}
      </nav>

      {tab === "catalog" ? (
        <main className="max-w-5xl mx-auto px-3 pt-4 pb-28">
          <div className="relative mb-4">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Chèche yon pwodwi..."
              className="w-full rounded-full border-2 bg-white pl-11 pr-4 py-3 text-base focus:outline-none"
              style={{ borderColor: BORDER }}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-3 -mx-3 px-3">
            {[null, ...categories].map((c) => (
              <button
                key={c ?? "all"}
                onClick={() => setCategory(c)}
                className="whitespace-nowrap rounded-full border-2 px-5 py-2.5 text-base font-bold"
                style={
                  category === c
                    ? { background: GREEN_DARK, color: "#fff", borderColor: GREEN_DARK }
                    : { background: "#fff", color: "#3a3a2a", borderColor: BORDER }
                }
              >
                {c ?? "Tout"}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <p className="text-center py-16 opacity-60">
              {shop.products.length === 0 ? "Poko gen pwodwi nan boutik la." : "Okenn pwodwi pa matche."}
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.map((p) => {
                const out = p.stock <= 0;
                const qty = cart[p.id] ?? 0;
                return (
                  <article
                    key={p.id}
                    className="rounded-[26px] border-2 p-3 flex flex-col"
                    style={{ background: CARD, borderColor: BORDER }}
                  >
                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-white">
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.imageUrl} alt={p.name} loading="lazy" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center opacity-25">
                          <ShoppingBag size={40} />
                        </div>
                      )}
                      {out && (
                        <span
                          className="absolute top-2 right-0 rounded-full px-3 py-1.5 text-[11px] font-extrabold text-white tracking-wide"
                          style={{ background: BRICK }}
                        >
                          PA DISPONIB
                        </span>
                      )}
                    </div>

                    <h2 className="mt-3 text-[17px] font-extrabold leading-tight uppercase">{p.name}</h2>
                    <p className="text-sm opacity-60 mt-0.5">{p.category}</p>
                    <p className="mt-2 font-mono text-lg font-bold" style={{ color: GREEN_DARK }}>
                      {money(p.price)}
                    </p>
                    <p className="text-sm opacity-70 mb-3">
                      {out ? "Fini pou kounye a" : `${p.stock.toLocaleString("fr-FR")} ${p.unit} disponib`.replace("  ", " ")}
                    </p>

                    <div className="mt-auto space-y-2">
                      {out ? (
                        <>
                          <button disabled className="w-full rounded-xl py-3 text-base font-bold" style={{ background: "#d9cca0", color: "#8b8159" }}>
                            Pa Disponib
                          </button>
                          <button
                            onClick={() => setNotifyFor(p)}
                            className="w-full rounded-xl border-2 bg-white py-2.5 text-base font-semibold flex items-center justify-center gap-2"
                            style={{ borderColor: BORDER }}
                          >
                            <Bell size={16} /> Notifye m lè l disponib
                          </button>
                        </>
                      ) : qty === 0 ? (
                        <button
                          onClick={() => setQty(p, 1)}
                          className="w-full rounded-xl py-3 text-base font-bold text-white flex items-center justify-center gap-1"
                          style={{ background: GREEN_DARK }}
                        >
                          <Plus size={18} /> Ajoute
                        </button>
                      ) : (
                        <div className="flex items-center justify-between rounded-xl p-1" style={{ background: GREEN_DARK }}>
                          <button aria-label="Mwens" onClick={() => setQty(p, qty - 1)} className="w-11 h-11 flex items-center justify-center text-white">
                            <Minus size={18} />
                          </button>
                          <span className="text-white font-bold text-lg">{qty}</span>
                          <button aria-label="Plis" onClick={() => setQty(p, qty + 1)} disabled={qty >= p.stock} className="w-11 h-11 flex items-center justify-center text-white disabled:opacity-40">
                            <Plus size={18} />
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>
      ) : (
        <CartView
          shop={shop}
          lines={cartLines}
          total={total}
          money={money}
          setQty={setQty}
          onBrowse={() => setTab("catalog")}
          onPlaced={(o) => {
            setPlaced(o);
            persist({});
            refresh();
          }}
        />
      )}

      {/* Bar panye k ap flote */}
      {tab === "catalog" && itemCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            onClick={() => setTab("cart")}
            className="mx-auto max-w-xl w-full rounded-2xl text-white px-5 py-4 flex items-center justify-between shadow-xl"
            style={{ background: GREEN_DARK }}
          >
            <span className="font-bold">Panye · {itemCount} atik</span>
            <span className="font-mono font-bold">{money(total)}</span>
          </button>
        </div>
      )}

      {notifyFor && <NotifyModal slug={shop.slug} product={notifyFor} onClose={() => setNotifyFor(null)} />}
      {placed && <SuccessModal shop={shop} placed={placed} money={money} onClose={() => { setPlaced(null); setTab("catalog"); }} />}
    </div>
  );
}

/* ------------------------------ Panye + kòmand ------------------------------ */

function CartView({
  shop,
  lines,
  total,
  money,
  setQty,
  onBrowse,
  onPlaced,
}: {
  shop: PublicShop;
  lines: { p: PublicProduct; qty: number }[];
  total: number;
  money: (n: number) => string;
  setQty: (p: PublicProduct, q: number) => void;
  onBrowse: () => void;
  onPlaced: (o: Placed) => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [pay, setPay] = useState<PayMethod>("cash_delivery");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const field = "w-full rounded-xl border-2 bg-white px-4 py-3 text-base focus:outline-none";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || lines.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/shop/${shop.slug}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name,
          phone,
          address,
          note,
          paymentMethod: pay,
          items: lines.map((l) => ({ productId: l.p.id, qty: l.qty })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Pa ka voye kòmand lan. Eseye ankò.");
      } else {
        onPlaced({
          code: data.order.code,
          total: data.order.total,
          paymentLabel: data.order.paymentLabel,
          lines: data.order.lines,
          customerName: name,
          phone,
          address,
          payment: pay,
        });
      }
    } catch {
      setError("Erè rezo — verifye entènèt ou epi eseye ankò.");
    }
    setBusy(false);
  }

  if (lines.length === 0) {
    return (
      <main className="max-w-xl mx-auto px-4 py-20 text-center">
        <ShoppingBag size={36} className="mx-auto mb-3 opacity-30" />
        <p className="mb-5 opacity-70">Panye ou vid.</p>
        <button onClick={onBrowse} className="rounded-xl px-6 py-3 font-bold text-white" style={{ background: GREEN_DARK }}>
          Gade pwodwi yo
        </button>
      </main>
    );
  }

  return (
    <main className="max-w-xl mx-auto px-3 pt-4 pb-16">
      <div className="space-y-2 mb-5">
        {lines.map(({ p, qty }) => (
          <div key={p.id} className="flex items-center gap-3 rounded-2xl border-2 p-2.5" style={{ background: CARD, borderColor: BORDER }}>
            {p.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.imageUrl} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-white shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm uppercase leading-tight">{p.name}</p>
              <p className="font-mono text-sm" style={{ color: GREEN_DARK }}>{money(p.price * qty)}</p>
              <div className="flex items-center gap-1 mt-1">
                <button aria-label="Mwens" onClick={() => setQty(p, qty - 1)} className="w-8 h-8 rounded-lg bg-white border flex items-center justify-center" style={{ borderColor: BORDER }}>
                  <Minus size={14} />
                </button>
                <span className="w-9 text-center font-bold">{qty}</span>
                <button aria-label="Plis" onClick={() => setQty(p, qty + 1)} disabled={qty >= p.stock} className="w-8 h-8 rounded-lg bg-white border flex items-center justify-center disabled:opacity-40" style={{ borderColor: BORDER }}>
                  <Plus size={14} />
                </button>
              </div>
            </div>
            <button aria-label="Retire" onClick={() => setQty(p, 0)} className="p-2 opacity-50">
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        <div className="flex items-center justify-between px-2 pt-2 text-lg font-extrabold">
          <span>Total</span>
          <span className="font-mono" style={{ color: GREEN_DARK }}>{money(total)}</span>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-3 rounded-[26px] border-2 p-4" style={{ background: CARD, borderColor: BORDER }}>
        <h2 style={{ fontFamily: "var(--font-display), serif" }} className="text-xl font-semibold">Enfòmasyon ou</h2>
        <input className={field} style={{ borderColor: BORDER }} placeholder="Non konplè *" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} autoComplete="name" />
        <input className={field} style={{ borderColor: BORDER }} placeholder="Telefòn / WhatsApp *" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required autoComplete="tel" />
        <input className={field} style={{ borderColor: BORDER }} placeholder="Adrès livrezon (si w bezwen livrezon)" value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="street-address" />
        <textarea className={field} style={{ borderColor: BORDER }} placeholder="Nòt pou biznis la (opsyonèl)" rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} />

        <div>
          <p className="text-sm font-bold mb-2">Kijan ou vle peye?</p>
          <div className="grid grid-cols-2 gap-2">
            {PAY_OPTIONS.map((o) => (
              <button
                type="button"
                key={o.id}
                onClick={() => setPay(o.id)}
                className="rounded-xl border-2 py-2.5 text-sm font-bold"
                style={pay === o.id ? { background: GREEN_DARK, color: "#fff", borderColor: GREEN_DARK } : { background: "#fff", borderColor: BORDER }}
              >
                {o.label}
              </button>
            ))}
          </div>
          {pay !== "cash_delivery" && (
            <p className="mt-2 text-sm rounded-xl bg-white border px-3 py-2" style={{ borderColor: BORDER }}>
              {shop.paymentInfo
                ? shop.paymentInfo
                : "Biznis la ap kontakte w ak enstriksyon peman an apre kòmand lan."}
            </p>
          )}
        </div>

        <button type="submit" disabled={busy} className="w-full rounded-xl py-4 text-lg font-extrabold text-white disabled:opacity-60 flex items-center justify-center gap-2" style={{ background: GREEN_DARK }}>
          {busy ? <Loader2 size={20} className="animate-spin" /> : null} Konfime kòmand lan · {money(total)}
        </button>
        {error && <p className="text-center text-sm font-medium" style={{ color: BRICK }}>{error}</p>}
      </form>
    </main>
  );
}

/* ------------------------------ Modals ------------------------------ */

function Sheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] max-h-[90vh] overflow-y-auto"
        style={{ background: CREAM }}
      >
        {children}
      </div>
    </div>
  );
}

function NotifyModal({ slug, product, onClose }: { slug: string; product: PublicProduct; onClose: () => void }) {
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("busy");
    try {
      const res = await fetch(`/api/shop/${slug}/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, phone }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  return (
    <Sheet onClose={onClose}>
      <div className="flex justify-between items-start mb-3">
        <h3 style={{ fontFamily: "var(--font-display), serif" }} className="text-xl font-semibold pr-6">
          Notifye m lè l disponib
        </h3>
        <button onClick={onClose} aria-label="Fèmen"><X size={22} /></button>
      </div>
      {state === "done" ? (
        <p className="flex items-center gap-2 font-medium" style={{ color: GREEN_DARK }}>
          <Check size={20} /> Nou anrejistre nimewo ou. Biznis la ap kontakte w.
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <p className="text-sm opacity-70 uppercase font-bold">{product.name}</p>
          <input
            className="w-full rounded-xl border-2 bg-white px-4 py-3 text-base focus:outline-none"
            style={{ borderColor: BORDER }}
            placeholder="Telefòn / WhatsApp"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            minLength={7}
            autoFocus
          />
          <button disabled={state === "busy"} className="w-full rounded-xl py-3.5 font-bold text-white disabled:opacity-60" style={{ background: GREEN_DARK }}>
            {state === "busy" ? "..." : "Voye"}
          </button>
          {state === "error" && <p className="text-sm text-center" style={{ color: BRICK }}>Pa ka anrejistre. Eseye ankò.</p>}
        </form>
      )}
    </Sheet>
  );
}

function SuccessModal({
  shop,
  placed,
  money,
  onClose,
}: {
  shop: PublicShop;
  placed: Placed;
  money: (n: number) => string;
  onClose: () => void;
}) {
  const summary = [
    `Bonjou ${shop.name}, mwen fèk fè kòmand #${placed.code} sou sit la:`,
    ...placed.lines.map((l) => `• ${l.qty}${l.unit ? " " + l.unit : ""} × ${l.name} — ${money(l.qty * l.unitPrice)}`),
    `Total: ${money(placed.total)}`,
    `Peman: ${placed.paymentLabel}`,
    `Non: ${placed.customerName}`,
    `Telefòn: ${placed.phone}`,
    placed.address ? `Adrès: ${placed.address}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const waLink = shop.whatsapp ? `https://wa.me/${shop.whatsapp}?text=${encodeURIComponent(summary)}` : null;

  return (
    <Sheet onClose={onClose}>
      <div className="text-center">
        <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center text-white mb-3" style={{ background: GREEN }}>
          <Check size={30} />
        </div>
        <h3 style={{ fontFamily: "var(--font-display), serif" }} className="text-2xl font-semibold">Kòmand lan voye!</h3>
        <p className="mt-1 opacity-70">Nimewo kòmand ou:</p>
        <p className="font-mono text-3xl font-bold my-1" style={{ color: GREEN_DARK }}>#{placed.code}</p>
        <p className="font-mono font-bold mb-4">{money(placed.total)}</p>
        <p className="text-sm opacity-80 mb-5">
          {shop.name} ap kontakte w sou {placed.phone} pou konfime kòmand lan{placed.payment === "cash_delivery" ? "" : " ak peman an"}.
          {waLink ? " Pou ale pi vit, voye kòmand lan sou WhatsApp tou:" : ""}
        </p>
        {waLink && (
          <a href={waLink} target="_blank" rel="noreferrer" className="w-full mb-2 rounded-xl py-3.5 font-bold text-white flex items-center justify-center gap-2" style={{ background: "#25a244" }}>
            <MessageCircle size={20} /> Voye sou WhatsApp
          </a>
        )}
        <button onClick={onClose} className="w-full rounded-xl py-3 font-bold border-2 bg-white" style={{ borderColor: BORDER }}>
          Retounen nan katalòg la
        </button>
      </div>
    </Sheet>
  );
}
