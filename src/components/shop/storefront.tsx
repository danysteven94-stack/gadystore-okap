"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, Check, Loader2, MessageCircle, Minus, Plus, Search, ShoppingBag, Trash2, X } from "lucide-react";
import type { PublicProduct, PublicShop } from "@/lib/shop";

// Palèt: blan, nwa ak rouj
const C = {
  forest: "#111111",
  forestMid: "#2A2A2A",
  forestSoft: "#F3F3F3",
  gold: "#C8102E",
  bg: "#FFFFFF",
  card: "#ffffff",
  line: "#E5E5E5",
  ink: "#111111",
  muted: "#6B6B6B",
  danger: "#C8102E",
  warn: "#6B6B6B",
  ok: "#111111",
};

const DISPLAY = { fontFamily: "var(--font-sans), system-ui, sans-serif" } as const;
const clamp2 = {
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
} as const;

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
  const [detail, setDetail] = useState<PublicProduct | null>(null);
  const [placed, setPlaced] = useState<Placed | null>(null);

  const cartKey = `cart:${shop.slug}`;

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

  useEffect(() => {
    const onVis = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [refresh]);

  const byId = useMemo(() => new Map(shop.products.map((p) => [p.id, p])), [shop.products]);

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
    (p) => p.name.toLowerCase().includes(query.toLowerCase()) && (!category || p.category === category)
  );

  const initialLetter = shop.name.trim().charAt(0).toUpperCase() || "B";
  const waHello = shop.whatsapp
    ? `https://wa.me/${shop.whatsapp}?text=${encodeURIComponent(`Bonjou ${shop.name}, mwen vle plis enfòmasyon.`)}`
    : null;

  return (
    <div className="min-h-screen" style={{ background: C.bg, color: C.ink }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        @keyframes heroZoom { from { transform: scale(1.08); } to { transform: scale(1); } }
      `}</style>

      {/* ---------- Header / Hero ---------- */}
      <header className="relative overflow-hidden text-white text-center px-4 pt-[max(2.5rem,env(safe-area-inset-top))] pb-20 sm:pb-24 z-0">
        {shop.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={shop.coverUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ animation: "heroZoom 1.4s ease-out both" }}
          />
        ) : (
          <>
            <div className="absolute inset-0" style={{ background: `linear-gradient(160deg, ${C.forestMid} 0%, ${C.forest} 70%)` }} />
            <div aria-hidden className="absolute -top-28 -right-24 w-80 h-80 rounded-full opacity-[.12]" style={{ background: C.gold }} />
            <div aria-hidden className="absolute -bottom-32 -left-20 w-72 h-72 rounded-full opacity-[.08]" style={{ background: "#fff" }} />
          </>
        )}
        {/* Vwal pou tèks la rete lizib sou nenpot imaj */}
        <div
          className="absolute inset-0"
          style={{
            background: shop.coverUrl
              ? "linear-gradient(180deg, rgba(0,0,0,.50) 0%, rgba(0,0,0,.62) 55%, rgba(0,0,0,.88) 100%)"
              : "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,.18) 100%)",
          }}
        />

        <div className="relative max-w-3xl mx-auto" style={{ animation: "fadeUp .7s ease-out both" }}>
          <div
            className="mx-auto w-24 h-24 rounded-full overflow-hidden flex items-center justify-center text-4xl font-semibold mb-5"
            style={{
              ...DISPLAY,
              background: "#fff",
              color: C.forest,
              boxShadow: `0 0 0 3px ${C.gold}, 0 12px 32px rgba(0,0,0,.35)`,
            }}
          >
            {shop.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shop.logoUrl} alt={shop.name} className="w-full h-full object-cover" />
            ) : (
              initialLetter
            )}
          </div>
          <h1
            style={{ ...DISPLAY, textShadow: "0 2px 18px rgba(0,0,0,.45)" }}
            className="text-4xl sm:text-6xl font-semibold leading-tight tracking-tight"
          >
            {shop.name}
          </h1>
          <div className="mx-auto my-4 flex items-center justify-center gap-3">
            <span className="h-px w-10" style={{ background: C.gold }} />
            <span className="w-1.5 h-1.5 rotate-45" style={{ background: C.gold }} />
            <span className="h-px w-10" style={{ background: C.gold }} />
          </div>
          <p className="text-[11px] sm:text-sm tracking-[0.3em] uppercase opacity-90">{shop.tagline}</p>

          <div className="mt-6 flex items-center justify-center gap-2.5 flex-wrap">
            <span className="rounded-full bg-white/15 backdrop-blur px-4 py-2 text-xs font-medium border border-white/20">
              {shop.products.length} pwodwi
            </span>
            {waHello && (
              <a
                href={waHello}
                target="_blank"
                rel="noreferrer"
                className="rounded-full px-5 py-2 text-xs font-bold inline-flex items-center gap-1.5 shadow-lg"
                style={{ background: C.gold, color: "#fff" }}
              >
                <MessageCircle size={14} /> Kontakte nou
              </a>
            )}
          </div>
        </div>
      </header>
      {/* Kwen won ki fè tranzisyon an dous */}
      <div className="relative z-10 -mt-7 h-7 rounded-t-[28px]" style={{ background: C.bg }} />

      {/* ---------- Tabs ---------- */}
      <nav className="sticky top-0 z-30 backdrop-blur border-b" style={{ background: "rgba(255,255,255,.94)", borderColor: C.line }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2">
          {(
            [
              ["catalog", "Katalòg"],
              ["cart", "Panye"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="relative py-3.5 text-[15px] font-semibold flex items-center justify-center gap-2"
              style={{ color: tab === id ? C.forest : C.muted }}
            >
              {id === "cart" && <ShoppingBag size={17} />}
              {label}
              {id === "cart" && itemCount > 0 && (
                <span className="min-w-5 h-5 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center text-white" style={{ background: C.danger }}>
                  {itemCount}
                </span>
              )}
              {tab === id && <span className="absolute bottom-0 left-8 right-8 h-[3px] rounded-t" style={{ background: C.forest }} />}
            </button>
          ))}
        </div>
      </nav>

      {tab === "catalog" ? (
        <main className="max-w-5xl mx-auto px-4 pt-5 pb-32">
          <div className="relative mb-4">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: C.muted }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Chèche yon pwodwi..."
              className="w-full rounded-2xl border bg-white pl-11 pr-4 py-3.5 text-[15px] focus:outline-none focus:ring-2"
              style={{ borderColor: C.line, ["--tw-ring-color" as string]: C.forestMid }}
            />
          </div>

          {categories.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-4 -mx-4 px-4 [scrollbar-width:none]">
              {[null, ...categories].map((c) => {
                const active = category === c;
                return (
                  <button
                    key={c ?? "all"}
                    onClick={() => setCategory(c)}
                    className="whitespace-nowrap rounded-full px-5 py-2 text-sm font-semibold border transition-colors"
                    style={
                      active
                        ? { background: C.forest, color: "#fff", borderColor: C.forest }
                        : { background: "#fff", color: C.ink, borderColor: C.line }
                    }
                  >
                    {c ?? "Tout"}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex items-end justify-between mb-4">
            <h2 style={DISPLAY} className="text-2xl font-semibold">Pwodwi nou yo</h2>
            <span className="text-xs" style={{ color: C.muted }}>{filtered.length} rezilta</span>
          </div>

          {filtered.length === 0 ? (
            <p className="text-center py-20" style={{ color: C.muted }}>
              {shop.products.length === 0 ? "Poko gen pwodwi nan boutik la." : "Okenn pwodwi pa matche."}
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
              {filtered.map((p, i) => (
                <ProductCard
                  key={p.id}
                  index={i}
                  p={p}
                  qty={cart[p.id] ?? 0}
                  money={money}
                  setQty={setQty}
                  onOpen={() => setDetail(p)}
                  onNotify={() => setNotifyFor(p)}
                />
              ))}
            </div>
          )}

          <footer className="mt-14 text-center text-xs space-y-1" style={{ color: C.muted }}>
            <p style={DISPLAY} className="text-base" >{shop.name}</p>
            {waHello && (
              <a href={waHello} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                Kontakte nou sou WhatsApp
              </a>
            )}
          </footer>
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

      {/* ---------- Bar panye ---------- */}
      {tab === "catalog" && itemCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            onClick={() => setTab("cart")}
            className="mx-auto max-w-xl w-full rounded-2xl text-white px-5 py-4 flex items-center justify-between shadow-2xl"
            style={{ background: C.forest }}
          >
            <span className="flex items-center gap-2 font-semibold">
              <ShoppingBag size={18} /> Wè panye a · {itemCount}
            </span>
            <span className="font-bold tabular-nums">{money(total)}</span>
          </button>
        </div>
      )}

      {detail && byId.get(detail.id) && (
        <DetailSheet
          p={byId.get(detail.id)!}
          qty={cart[detail.id] ?? 0}
          money={money}
          setQty={setQty}
          onNotify={() => {
            setNotifyFor(detail);
            setDetail(null);
          }}
          onClose={() => setDetail(null)}
        />
      )}
      {notifyFor && <NotifyModal slug={shop.slug} product={notifyFor} onClose={() => setNotifyFor(null)} />}
      {placed && (
        <SuccessModal
          shop={shop}
          placed={placed}
          money={money}
          onClose={() => {
            setPlaced(null);
            setTab("catalog");
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------ Kat pwodwi ------------------------------ */

function StockLine({ p }: { p: PublicProduct }) {
  const out = p.stock <= 0;
  const low = !out && p.stock <= 5;
  const color = out ? C.danger : low ? C.warn : C.ok;
  const text = out
    ? "Fini pou kounye a"
    : low
    ? `Sèlman ${p.stock}${p.unit ? " " + p.unit : ""} rete`
    : `${p.stock.toLocaleString("fr-FR")}${p.unit ? " " + p.unit : ""} disponib`;
  return (
    <p className="flex items-center gap-1.5 text-xs font-medium" style={{ color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {text}
    </p>
  );
}

function QtyControl({ p, qty, setQty, size = "md" }: { p: PublicProduct; qty: number; setQty: (p: PublicProduct, q: number) => void; size?: "md" | "lg" }) {
  const h = size === "lg" ? "h-13 min-h-[52px]" : "h-11";
  if (qty === 0) {
    return (
      <button
        onClick={() => setQty(p, 1)}
        className={`w-full ${h} rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-1.5 active:scale-[.98] transition-transform`}
        style={{ background: C.forest }}
      >
        <Plus size={16} /> Ajoute nan panye
      </button>
    );
  }
  return (
    <div className={`flex items-center justify-between rounded-xl ${h} px-1`} style={{ background: C.forestSoft, color: C.forest }}>
      <button aria-label="Mwens" onClick={() => setQty(p, qty - 1)} className="w-10 h-full flex items-center justify-center">
        <Minus size={17} />
      </button>
      <span className="font-bold tabular-nums">{qty}</span>
      <button aria-label="Plis" onClick={() => setQty(p, qty + 1)} disabled={qty >= p.stock} className="w-10 h-full flex items-center justify-center disabled:opacity-30">
        <Plus size={17} />
      </button>
    </div>
  );
}

function ProductCard({
  index,
  p,
  qty,
  money,
  setQty,
  onOpen,
  onNotify,
}: {
  index: number;
  p: PublicProduct;
  qty: number;
  money: (n: number) => string;
  setQty: (p: PublicProduct, q: number) => void;
  onOpen: () => void;
  onNotify: () => void;
}) {
  const out = p.stock <= 0;
  return (
    <article
      className="group rounded-2xl bg-white border flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
      style={{ borderColor: C.line, animation: `fadeUp .5s ease-out ${Math.min(index, 10) * 60}ms both` }}
    >
      <button onClick={onOpen} className="relative block aspect-square w-full overflow-hidden" style={{ background: "#F3F3F3" }} aria-label={p.name}>
        {p.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.imageUrl}
            alt={p.name}
            loading="lazy"
            className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${out ? "grayscale opacity-60" : ""}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ color: C.line }}>
            <ShoppingBag size={44} />
          </div>
        )}
        {out && (
          <span className="absolute top-2.5 left-2.5 rounded-full px-3 py-1 text-[10px] font-bold tracking-wider text-white" style={{ background: C.danger }}>
            PA DISPONIB
          </span>
        )}
        {!out && p.stock <= 5 && (
          <span className="absolute top-2.5 left-2.5 rounded-full px-3 py-1 text-[10px] font-bold tracking-wider" style={{ background: C.gold, color: "#fff" }}>
            BALEN
          </span>
        )}
      </button>

      <div className="p-3.5 flex flex-col flex-1">
        <p className="text-[10px] font-semibold tracking-[0.14em] uppercase" style={{ color: C.muted }}>
          {p.category}
        </p>
        <button onClick={onOpen} className="text-left">
          <h2 className="mt-1 text-[15px] font-semibold leading-snug min-h-[2.6em]" style={clamp2}>
            {p.name}
          </h2>
        </button>
        <p className="mt-1.5 text-lg font-bold tabular-nums" style={{ color: C.forest }}>
          {money(p.price)}
        </p>
        <div className="mt-1 mb-3">
          <StockLine p={p} />
        </div>

        <div className="mt-auto space-y-2">
          {out ? (
            <button
              onClick={onNotify}
              className="w-full h-11 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2"
              style={{ borderColor: C.forest, color: C.forest }}
            >
              <Bell size={15} /> Notifye m
            </button>
          ) : (
            <QtyControl p={p} qty={qty} setQty={setQty} />
          )}
        </div>
      </div>
    </article>
  );
}

function DetailSheet({
  p,
  qty,
  money,
  setQty,
  onNotify,
  onClose,
}: {
  p: PublicProduct;
  qty: number;
  money: (n: number) => string;
  setQty: (p: PublicProduct, q: number) => void;
  onNotify: () => void;
  onClose: () => void;
}) {
  const out = p.stock <= 0;
  return (
    <Sheet onClose={onClose} flush>
      <div className="relative">
        <div className="aspect-square sm:aspect-[4/3] w-full" style={{ background: "#F3F3F3" }}>
          {p.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.imageUrl} alt={p.name} className={`w-full h-full object-cover ${out ? "grayscale opacity-70" : ""}`} />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ color: C.line }}>
              <ShoppingBag size={64} />
            </div>
          )}
        </div>
        <button onClick={onClose} aria-label="Fèmen" className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/95 shadow flex items-center justify-center">
          <X size={18} />
        </button>
      </div>
      <div className="p-5">
        <p className="text-[11px] font-semibold tracking-[0.14em] uppercase" style={{ color: C.muted }}>{p.category}</p>
        <h3 style={DISPLAY} className="text-2xl font-semibold leading-tight mt-1">{p.name}</h3>
        <p className="text-2xl font-bold tabular-nums mt-2" style={{ color: C.forest }}>{money(p.price)}</p>
        <div className="mt-1 mb-4"><StockLine p={p} /></div>
        {p.description && <p className="text-sm leading-relaxed mb-5" style={{ color: "#3A3A3A" }}>{p.description}</p>}
        {out ? (
          <button onClick={onNotify} className="w-full min-h-[52px] rounded-xl border text-base font-semibold flex items-center justify-center gap-2" style={{ borderColor: C.forest, color: C.forest }}>
            <Bell size={17} /> Notifye m lè l disponib
          </button>
        ) : (
          <QtyControl p={p} qty={qty} setQty={setQty} size="lg" />
        )}
      </div>
    </Sheet>
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

  const field = "w-full rounded-xl border bg-white px-4 py-3.5 text-[15px] focus:outline-none focus:ring-2";
  const fieldStyle = { borderColor: C.line, ["--tw-ring-color" as string]: C.forestMid };

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
      <main className="max-w-xl mx-auto px-4 py-24 text-center">
        <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: C.forestSoft, color: C.forest }}>
          <ShoppingBag size={28} />
        </div>
        <p className="mb-6" style={{ color: C.muted }}>Panye ou vid.</p>
        <button onClick={onBrowse} className="rounded-xl px-7 py-3.5 font-semibold text-white" style={{ background: C.forest }}>
          Gade pwodwi yo
        </button>
      </main>
    );
  }

  return (
    <main className="max-w-xl mx-auto px-4 pt-5 pb-16">
      <div className="rounded-2xl bg-white border divide-y mb-5" style={{ borderColor: C.line }}>
        {lines.map(({ p, qty }) => (
          <div key={p.id} className="flex items-center gap-3 p-3" style={{ borderColor: C.line }}>
            {p.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.imageUrl} alt="" className="w-[68px] h-[68px] rounded-xl object-cover shrink-0" />
            ) : (
              <div className="w-[68px] h-[68px] rounded-xl shrink-0" style={{ background: "#F3F3F3" }} />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm leading-snug" style={clamp2}>{p.name}</p>
              <p className="text-sm font-bold tabular-nums mt-0.5" style={{ color: C.forest }}>{money(p.price * qty)}</p>
              <div className="flex items-center gap-1 mt-1.5">
                <button aria-label="Mwens" onClick={() => setQty(p, qty - 1)} className="w-8 h-8 rounded-lg border flex items-center justify-center" style={{ borderColor: C.line }}>
                  <Minus size={14} />
                </button>
                <span className="w-9 text-center font-bold tabular-nums">{qty}</span>
                <button aria-label="Plis" onClick={() => setQty(p, qty + 1)} disabled={qty >= p.stock} className="w-8 h-8 rounded-lg border flex items-center justify-center disabled:opacity-30" style={{ borderColor: C.line }}>
                  <Plus size={14} />
                </button>
              </div>
            </div>
            <button aria-label="Retire" onClick={() => setQty(p, 0)} className="p-2" style={{ color: C.muted }}>
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        <div className="flex items-center justify-between px-4 py-4 text-lg font-bold">
          <span>Total</span>
          <span className="tabular-nums" style={{ color: C.forest }}>{money(total)}</span>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-3 rounded-2xl bg-white border p-5" style={{ borderColor: C.line }}>
        <h2 style={DISPLAY} className="text-xl font-semibold">Enfòmasyon ou</h2>
        <input className={field} style={fieldStyle} placeholder="Non konplè *" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} autoComplete="name" />
        <input className={field} style={fieldStyle} placeholder="Telefòn / WhatsApp *" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required autoComplete="tel" />
        <input className={field} style={fieldStyle} placeholder="Adrès livrezon (si w bezwen livrezon)" value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="street-address" />
        <textarea className={field} style={fieldStyle} placeholder="Nòt pou boutik la (opsyonèl)" rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} />

        <div>
          <p className="text-sm font-semibold mb-2">Kijan ou vle peye?</p>
          <div className="grid grid-cols-2 gap-2">
            {PAY_OPTIONS.map((o) => (
              <button
                type="button"
                key={o.id}
                onClick={() => setPay(o.id)}
                className="rounded-xl border py-3 text-sm font-semibold"
                style={pay === o.id ? { background: C.forest, color: "#fff", borderColor: C.forest } : { background: "#fff", borderColor: C.line }}
              >
                {o.label}
              </button>
            ))}
          </div>
          {pay !== "cash_delivery" && (
            <p className="mt-2 text-sm rounded-xl px-3.5 py-3 whitespace-pre-line" style={{ background: C.forestSoft, color: C.forest }}>
              {shop.paymentInfo || "Boutik la ap kontakte w ak enstriksyon peman an apre kòmand lan."}
            </p>
          )}
        </div>

        <button type="submit" disabled={busy} className="w-full min-h-[54px] rounded-xl text-base font-bold text-white disabled:opacity-60 flex items-center justify-center gap-2" style={{ background: C.forest }}>
          {busy && <Loader2 size={20} className="animate-spin" />} Konfime kòmand lan · {money(total)}
        </button>
        {error && <p className="text-center text-sm font-medium" style={{ color: C.danger }}>{error}</p>}
      </form>
    </main>
  );
}

/* ------------------------------ Modals ------------------------------ */

function Sheet({ children, onClose, flush }: { children: React.ReactNode; onClose: () => void; flush?: boolean }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/55" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto ${flush ? "" : "p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]"}`}
        style={{ background: C.bg }}
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
        <h3 style={DISPLAY} className="text-xl font-semibold pr-6">Notifye m lè l disponib</h3>
        <button onClick={onClose} aria-label="Fèmen"><X size={22} /></button>
      </div>
      {state === "done" ? (
        <p className="flex items-center gap-2 font-medium" style={{ color: C.forest }}>
          <Check size={20} /> Nou anrejistre nimewo ou. Boutik la ap kontakte w.
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <p className="text-sm font-semibold">{product.name}</p>
          <input
            className="w-full rounded-xl border bg-white px-4 py-3.5 text-[15px] focus:outline-none"
            style={{ borderColor: C.line }}
            placeholder="Telefòn / WhatsApp"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            minLength={7}
            autoFocus
          />
          <button disabled={state === "busy"} className="w-full min-h-[50px] rounded-xl font-bold text-white disabled:opacity-60" style={{ background: C.forest }}>
            {state === "busy" ? "..." : "Voye"}
          </button>
          {state === "error" && <p className="text-sm text-center" style={{ color: C.danger }}>Pa ka anrejistre. Eseye ankò.</p>}
        </form>
      )}
    </Sheet>
  );
}

function SuccessModal({ shop, placed, money, onClose }: { shop: PublicShop; placed: Placed; money: (n: number) => string; onClose: () => void }) {
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
        <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center text-white mb-3" style={{ background: C.ok }}>
          <Check size={30} />
        </div>
        <h3 style={DISPLAY} className="text-2xl font-semibold">Kòmand lan voye!</h3>
        <p className="mt-1 text-sm" style={{ color: C.muted }}>Nimewo kòmand ou</p>
        <p className="text-3xl font-bold my-1 tabular-nums" style={{ color: C.forest }}>#{placed.code}</p>
        <p className="font-bold mb-4 tabular-nums">{money(placed.total)}</p>
        <p className="text-sm mb-5" style={{ color: "#3A3A3A" }}>
          {shop.name} ap kontakte w sou {placed.phone} pou konfime kòmand lan{placed.payment === "cash_delivery" ? "" : " ak peman an"}.
          {waLink ? " Pou ale pi vit, voye kòmand lan sou WhatsApp tou:" : ""}
        </p>
        {waLink && (
          <a href={waLink} target="_blank" rel="noreferrer" className="w-full mb-2 min-h-[52px] rounded-xl font-bold text-white flex items-center justify-center gap-2" style={{ background: "#111111" }}>
            <MessageCircle size={20} /> Voye sou WhatsApp
          </a>
        )}
        <button onClick={onClose} className="w-full min-h-[48px] rounded-xl font-semibold border bg-white" style={{ borderColor: C.line }}>
          Retounen nan katalòg la
        </button>
      </div>
    </Sheet>
  );
}
