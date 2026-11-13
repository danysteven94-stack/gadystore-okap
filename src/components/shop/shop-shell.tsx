"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Bell, Check, Facebook, Heart, Home, Instagram, Loader2, MapPin, MessageCircle,
  Minus, Package, Plus, Search, ShoppingBag, Trash2, Truck, X,
} from "lucide-react";
import { useShop } from "./shop-context";
import { C, Sheet, SheetHeader, clamp2, fieldClass, fieldStyle } from "./ui";

export function ShopShell({ children }: { children: React.ReactNode }) {
  const { shop, base, money, itemCount, subtotal, wish, cartOpen, setCartOpen, notifyFor, setNotifyFor, toast } = useShop();
  const pathname = usePathname();

  const categories = useMemo(() => [...new Set(shop.products.map((p) => p.category))].sort(), [shop.products]);
  const hasSale = shop.products.some((p) => p.comparePrice);
  const initialLetter = shop.name.trim().charAt(0).toUpperCase() || "B";
  const announcement =
    shop.announcement ||
    (shop.deliveryEnabled && shop.freeShippingMin > 0 ? `Livrezon gratis pou kòmand ${money(shop.freeShippingMin)} oswa plis` : null);

  const waHello = shop.whatsapp
    ? `https://wa.me/${shop.whatsapp}?text=${encodeURIComponent(`Bonjou ${shop.name}, mwen vle plis enfòmasyon.`)}`
    : null;

  // Fèmen panye a lè nou chanje paj
  useEffect(() => {
    setCartOpen(false);
  }, [pathname, setCartOpen]);

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#111]">
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: none; } }
        @keyframes pop { from { opacity: 0; transform: translate(-50%, 10px); } to { opacity: 1; transform: translate(-50%, 0); } }
      `}</style>

      {announcement && (
        <div className="text-white text-center text-xs sm:text-sm font-medium px-4 py-2 pt-[max(0.5rem,env(safe-area-inset-top))]" style={{ background: C.red }}>
          {announcement}
        </div>
      )}

      {/* ---------- Header ---------- */}
      <header className="sticky top-0 z-40 bg-white border-b" style={{ borderColor: C.line }}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-3 sm:gap-6">
          <Link href={base} className="flex items-center gap-2.5 shrink-0 min-w-0">
            <span
              className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center font-bold text-white shrink-0"
              style={{ background: C.ink }}
            >
              {shop.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={shop.logoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                initialLetter
              )}
            </span>
            <span className="font-bold text-lg leading-tight truncate max-w-[34vw] sm:max-w-[220px]">{shop.name}</span>
          </Link>

          <div className="hidden md:block flex-1 max-w-2xl">
            <Suspense fallback={<div className="h-11" />}>
              <SearchBox />
            </Suspense>
          </div>

          <nav className="ml-auto flex items-center gap-1 sm:gap-2">
            <IconLink href={`${base}/wishlist`} label="Favori" count={wish.length} className="hidden sm:flex">
              <Heart size={22} />
            </IconLink>
            <IconLink href={`${base}/track`} label="Swiv kòmand" className="hidden sm:flex">
              <Package size={22} />
            </IconLink>
            <button
              onClick={() => setCartOpen(true)}
              aria-label="Panye"
              className="relative flex items-center gap-2 rounded-full px-3 h-11 text-white font-semibold"
              style={{ background: C.ink }}
            >
              <ShoppingBag size={20} />
              <span className="hidden sm:inline text-sm tabular-nums">{itemCount > 0 ? money(subtotal) : "Panye"}</span>
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center text-white" style={{ background: C.red }}>
                  {itemCount}
                </span>
              )}
            </button>
          </nav>
        </div>

        <div className="md:hidden px-4 pb-3">
          <Suspense fallback={<div className="h-11" />}>
            <SearchBox />
          </Suspense>
        </div>

        {(categories.length > 1 || hasSale) && (
          <div className="border-t" style={{ borderColor: C.line }}>
            <div className="max-w-6xl mx-auto px-4 flex gap-1 overflow-x-auto [scrollbar-width:none]">
              <Link href={base} className="whitespace-nowrap px-3 py-2.5 text-sm font-semibold">Tout</Link>
              {hasSale && (
                <Link href={`${base}?sale=1`} className="whitespace-nowrap px-3 py-2.5 text-sm font-bold" style={{ color: C.red }}>
                  Promosyon
                </Link>
              )}
              {categories.map((c) => (
                <Link key={c} href={`${base}?cat=${encodeURIComponent(c)}`} className="whitespace-nowrap px-3 py-2.5 text-sm font-medium" style={{ color: "#3A3A3A" }}>
                  {c}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      <div className="flex-1 pb-20 md:pb-0">{children}</div>

      {/* ---------- Footer ---------- */}
      <footer className="mt-10 text-white pb-24 md:pb-10" style={{ background: C.ink }}>
        <div className="max-w-6xl mx-auto px-4 py-10 grid gap-8 sm:grid-cols-3">
          <div>
            <p className="font-bold text-lg mb-2">{shop.name}</p>
            <p className="text-sm opacity-70">{shop.tagline}</p>
            <div className="flex gap-3 mt-4">
              {waHello && (
                <a href={waHello} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                  <MessageCircle size={18} />
                </a>
              )}
              {shop.facebook && (
                <a href={shop.facebook} target="_blank" rel="noreferrer noopener" aria-label="Facebook" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                  <Facebook size={18} />
                </a>
              )}
              {shop.instagram && (
                <a href={shop.instagram} target="_blank" rel="noreferrer noopener" aria-label="Instagram" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                  <Instagram size={18} />
                </a>
              )}
            </div>
          </div>
          <div>
            <p className="font-semibold mb-3">Èd</p>
            <ul className="space-y-2 text-sm opacity-80">
              <li><Link href={`${base}/track`}>Swiv kòmand mwen</Link></li>
              <li><Link href={`${base}/wishlist`}>Favori mwen</Link></li>
              <li><Link href={`${base}/about`}>Livrezon, peman ak retou</Link></li>
              {waHello && <li><a href={waHello} target="_blank" rel="noreferrer">Kontakte nou sou WhatsApp</a></li>}
            </ul>
          </div>
          <div className="text-sm opacity-80 space-y-2">
            <p className="font-semibold opacity-100 mb-3">Enfòmasyon</p>
            {shop.address && (
              <p className="flex gap-2"><MapPin size={16} className="shrink-0 mt-0.5" /> {shop.address}</p>
            )}
            {shop.hours && <p>🕘 {shop.hours}</p>}
            {shop.deliveryEnabled && (
              <p className="flex gap-2"><Truck size={16} className="shrink-0 mt-0.5" /> {shop.deliveryFee > 0 ? `Livrezon: ${money(shop.deliveryFee)}` : "Livrezon gratis"}</p>
            )}
          </div>
        </div>
        <div className="border-t border-white/10 text-center text-xs opacity-60 py-4">
          © {new Date().getFullYear()} {shop.name}
        </div>
      </footer>

      {/* ---------- Bann anba (telefòn) ---------- */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t grid grid-cols-4 pb-[env(safe-area-inset-bottom)]"
        style={{ borderColor: C.line }}
      >
        <BottomLink href={base} active={pathname === base} label="Akèy"><Home size={21} /></BottomLink>
        <BottomLink href={`${base}/wishlist`} active={pathname.endsWith("/wishlist")} label="Favori" count={wish.length}><Heart size={21} /></BottomLink>
        <BottomLink href={`${base}/track`} active={pathname.endsWith("/track")} label="Kòmand"><Package size={21} /></BottomLink>
        <button onClick={() => setCartOpen(true)} className="relative flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium">
          <span className="relative"><ShoppingBag size={21} />
            {itemCount > 0 && <span className="absolute -top-1.5 -right-2.5 min-w-4 h-4 px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center" style={{ background: C.red }}>{itemCount}</span>}
          </span>
          Panye
        </button>
      </nav>

      {cartOpen && <CartDrawer />}
      {notifyFor && <NotifyModal onClose={() => setNotifyFor(null)} />}

      {toast && (
        <div
          role="status"
          className="fixed left-1/2 bottom-24 md:bottom-8 z-[70] rounded-full px-5 py-3 text-sm font-semibold text-white shadow-2xl"
          style={{ background: C.ink, animation: "pop .2s ease-out both" }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

function IconLink({ href, label, count, className = "", children }: { href: string; label: string; count?: number; className?: string; children: React.ReactNode }) {
  return (
    <Link href={href} aria-label={label} title={label} className={`relative w-11 h-11 items-center justify-center rounded-full hover:bg-black/5 ${className}`}>
      {children}
      {!!count && (
        <span className="absolute top-1 right-0.5 min-w-4 h-4 px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center" style={{ background: C.red }}>
          {count}
        </span>
      )}
    </Link>
  );
}

function BottomLink({ href, active, label, count, children }: { href: string; active: boolean; label: string; count?: number; children: React.ReactNode }) {
  return (
    <Link href={href} className="relative flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium" style={{ color: active ? C.red : C.ink }}>
      <span className="relative">
        {children}
        {!!count && <span className="absolute -top-1.5 -right-2.5 min-w-4 h-4 px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center" style={{ background: C.red }}>{count}</span>}
      </span>
      {label}
    </Link>
  );
}

/* ------------------------------ Rechèch ak sijesyon ------------------------------ */

function SearchBox() {
  const { shop, base, money } = useShop();
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [focus, setFocus] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => setQ(sp.get("q") ?? ""), [sp]);

  useEffect(() => {
    const off = (e: MouseEvent) => wrap.current && !wrap.current.contains(e.target as Node) && setFocus(false);
    document.addEventListener("mousedown", off);
    return () => document.removeEventListener("mousedown", off);
  }, []);

  const hits = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (t.length < 2) return [];
    return shop.products
      .filter((p) => `${p.name} ${p.brand} ${p.category}`.toLowerCase().includes(t))
      .slice(0, 6);
  }, [q, shop.products]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setFocus(false);
    const t = q.trim();
    router.push(t ? `${base}?q=${encodeURIComponent(t)}` : base);
  }

  return (
    <div ref={wrap} className="relative">
      <form onSubmit={submit} role="search" className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: C.muted }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setFocus(true)}
          placeholder="Chèche yon pwodwi, yon mak..."
          enterKeyHint="search"
          className="w-full rounded-full border bg-[#F5F5F5] pl-11 pr-10 h-11 text-[15px] focus:outline-none focus:bg-white focus:ring-2 focus:ring-black/20"
          style={{ borderColor: C.line }}
        />
        {q && (
          <button type="button" onClick={() => { setQ(""); router.push(base); }} aria-label="Efase" className="absolute right-3 top-1/2 -translate-y-1/2 p-1">
            <X size={16} />
          </button>
        )}
      </form>
      {focus && hits.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 mt-2 rounded-2xl bg-white border shadow-2xl overflow-hidden" style={{ borderColor: C.line }}>
          {hits.map((p) => (
            <li key={p.id}>
              <Link href={`${base}/p/${p.id}`} onClick={() => setFocus(false)} className="flex items-center gap-3 px-3 py-2.5 hover:bg-black/5">
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                ) : (
                  <span className="w-10 h-10 rounded-lg shrink-0" style={{ background: C.soft }} />
                )}
                <span className="flex-1 min-w-0 text-sm font-medium truncate">{p.name}</span>
                <span className="text-sm font-bold tabular-nums">{money(p.price)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------ Panye ------------------------------ */

function CartDrawer() {
  const { shop, base, money, cartLines, subtotal, itemCount, setQty, setCartOpen } = useShop();
  const close = () => setCartOpen(false);
  const min = shop.freeShippingMin;
  const showFree = shop.deliveryEnabled && min > 0 && itemCount > 0;
  const remaining = Math.max(0, min - subtotal);

  return (
    <Sheet onClose={close} side="right">
      <div className="px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-3 border-b" style={{ borderColor: C.line }}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Panye ({itemCount})</h2>
          <button onClick={close} aria-label="Fèmen" className="p-1"><X size={22} /></button>
        </div>
        {showFree && (
          <div className="mt-3">
            <p className="text-xs font-medium mb-1.5">
              {remaining > 0 ? <>Ajoute <b>{money(remaining)}</b> pou livrezon gratis</> : <span style={{ color: C.ok }}>✓ Ou gen livrezon gratis!</span>}
            </p>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: C.line }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (subtotal / min) * 100)}%`, background: remaining > 0 ? C.red : C.ok }} />
            </div>
          </div>
        )}
      </div>

      {cartLines.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: C.soft }}><ShoppingBag size={28} /></div>
          <p className="mb-5" style={{ color: C.muted }}>Panye ou vid.</p>
          <button onClick={close} className="rounded-xl px-7 py-3.5 font-semibold text-white" style={{ background: C.ink }}>Kontinye achte</button>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: C.line }}>
            {cartLines.map(({ p, qty }) => (
              <div key={p.id} className="flex items-center gap-3 px-5 py-4" style={{ borderColor: C.line }}>
                <Link href={`${base}/p/${p.id}`} onClick={close} className="shrink-0">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt="" className="w-[72px] h-[72px] rounded-xl object-cover" />
                  ) : (
                    <div className="w-[72px] h-[72px] rounded-xl" style={{ background: C.soft }} />
                  )}
                </Link>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm leading-snug" style={clamp2}>{p.name}</p>
                  <p className="text-sm font-bold tabular-nums mt-0.5">{money(p.price * qty)}</p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <button aria-label="Mwens" onClick={() => setQty(p, qty - 1)} className="w-8 h-8 rounded-lg border flex items-center justify-center" style={{ borderColor: C.line }}><Minus size={14} /></button>
                    <span className="w-9 text-center font-bold tabular-nums">{qty}</span>
                    <button aria-label="Plis" onClick={() => setQty(p, qty + 1)} disabled={qty >= p.stock} className="w-8 h-8 rounded-lg border flex items-center justify-center disabled:opacity-30" style={{ borderColor: C.line }}><Plus size={14} /></button>
                  </div>
                </div>
                <button aria-label="Retire" onClick={() => setQty(p, 0)} className="p-2" style={{ color: C.muted }}><Trash2 size={18} /></button>
              </div>
            ))}
          </div>
          <div className="px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] border-t" style={{ borderColor: C.line }}>
            <div className="flex justify-between text-lg font-bold mb-1"><span>Sou-total</span><span className="tabular-nums">{money(subtotal)}</span></div>
            <p className="text-xs mb-3" style={{ color: C.muted }}>Livrezon ak koupon kalkile nan pwochen etap la.</p>
            <Link href={`${base}/checkout`} onClick={close} className="w-full min-h-[54px] rounded-xl text-base font-bold text-white flex items-center justify-center" style={{ background: C.red }}>
              Pase kòmand lan
            </Link>
          </div>
        </>
      )}
    </Sheet>
  );
}

/* ------------------------------ "Notifye m" ------------------------------ */

function NotifyModal({ onClose }: { onClose: () => void }) {
  const { shop, notifyFor: product } = useShop();
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  if (!product) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("busy");
    try {
      const res = await fetch(`/api/shop/${shop.slug}/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product!.id, phone }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  return (
    <Sheet onClose={onClose}>
      <SheetHeader title="Notifye m lè l disponib" onClose={onClose} />
      {state === "done" ? (
        <p className="flex items-center gap-2 font-medium"><Check size={20} /> Nou anrejistre nimewo ou. Boutik la ap kontakte w.</p>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <p className="text-sm font-semibold flex items-center gap-2"><Bell size={16} /> {product.name}</p>
          <input className={fieldClass} style={fieldStyle} placeholder="Telefòn / WhatsApp" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required minLength={7} autoFocus />
          <button disabled={state === "busy"} className="w-full min-h-[50px] rounded-xl font-bold text-white disabled:opacity-60 flex items-center justify-center gap-2" style={{ background: C.ink }}>
            {state === "busy" ? <Loader2 size={18} className="animate-spin" /> : "Voye"}
          </button>
          {state === "error" && <p className="text-sm text-center" style={{ color: C.red }}>Pa ka anrejistre. Eseye ankò.</p>}
        </form>
      )}
    </Sheet>
  );
}


