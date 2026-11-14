"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, MessageCircle, Minus, Package, Plus, Search, ShoppingCart, Store, Trash2, Truck } from "lucide-react";
import { useShop } from "./shop-provider";
import { C, Sheet, clamp2 } from "./ui";
import { deliveryFeeFor, variantLabel } from "@/lib/shop-utils";

function Logo({ size = 40 }: { size?: number }) {
  const { shop } = useShop();
  return (
    <span
      className="rounded-full overflow-hidden flex items-center justify-center font-bold text-white shrink-0"
      style={{ width: size, height: size, background: C.ink, fontSize: size * 0.45 }}
    >
      {shop.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={shop.logoUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        shop.name.trim().charAt(0).toUpperCase() || "B"
      )}
    </span>
  );
}

function SearchBox() {
  const { shop, base, money } = useShop();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLFormElement>(null);

  const categories = useMemo(() => [...new Set(shop.products.map((p) => p.category))].sort(), [shop.products]);
  const suggestions = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (t.length < 2) return [];
    return shop.products
      .filter((p) => (!cat || p.category === cat) && `${p.name} ${p.brand ?? ""} ${p.category}`.toLowerCase().includes(t))
      .slice(0, 6);
  }, [q, cat, shop.products]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setOpen(false);
    const sp = new URLSearchParams();
    if (q.trim()) sp.set("q", q.trim());
    if (cat) sp.set("cat", cat);
    router.push(`${base}${sp.toString() ? `?${sp}` : ""}`);
  }

  return (
    <form ref={boxRef} onSubmit={submit} role="search" className="relative flex-1 min-w-0">
      <div className="flex rounded-lg overflow-hidden border-2 bg-white" style={{ borderColor: C.ink }}>
        {categories.length > 1 && (
          <select
            aria-label="Kategori"
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            className="hidden sm:block max-w-[9rem] border-r px-2 text-sm bg-[#F5F5F5] focus:outline-none"
            style={{ borderColor: C.line, minHeight: 0 }}
          >
            <option value="">Tout</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Chèche yon pwodwi, yon mak..."
          className="flex-1 min-w-0 px-3 py-2.5 text-[15px] focus:outline-none"
          style={{ minHeight: 0 }}
          autoComplete="off"
        />
        <button type="submit" aria-label="Chèche" className="px-4 text-white flex items-center" style={{ background: C.red }}>
          <Search size={18} />
        </button>
      </div>
      {open && suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 top-full mt-1 z-50 rounded-lg border bg-white shadow-xl overflow-hidden" style={{ borderColor: C.line }}>
          {suggestions.map((p) => (
            <li key={p.id}>
              <Link
                href={`${base}/p/${p.id}`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2 hover:bg-[#F5F5F5]"
              >
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imageUrl} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
                ) : (
                  <span className="w-10 h-10 rounded shrink-0" style={{ background: C.soft }} />
                )}
                <span className="flex-1 min-w-0">
                  <span className="block text-sm truncate">{p.name}</span>
                  <span className="block text-xs" style={{ color: C.muted }}>
                    {p.category}
                  </span>
                </span>
                <span className="text-sm font-semibold tabular-nums">{money(p.price)}</span>
              </Link>
            </li>
          ))}
          <li>
            <button type="submit" className="w-full text-left px-3 py-2.5 text-sm font-semibold border-t" style={{ borderColor: C.line, color: C.red }}>
              Wè tout rezilta pou “{q.trim()}”
            </button>
          </li>
        </ul>
      )}
    </form>
  );
}

function CartDrawer() {
  const { shop, base, money, cartLines, itemCount, subtotal, setLineQty, removeLine, setCartOpen } = useShop();
  const close = () => setCartOpen(false);
  const fee = deliveryFeeFor(shop, subtotal, "delivery");
  const toFree = shop.freeDeliveryMin > 0 ? Math.max(0, shop.freeDeliveryMin - subtotal) : 0;
  const progress = shop.freeDeliveryMin > 0 ? Math.min(100, (subtotal / shop.freeDeliveryMin) * 100) : 0;

  return (
    <Sheet side="right" onClose={close} title={`Panye (${itemCount})`}>
      {cartLines.length === 0 ? (
        <div className="px-6 py-20 text-center">
          <ShoppingCart size={36} className="mx-auto mb-3" style={{ color: C.line }} />
          <p className="font-semibold mb-1">Panye ou vid</p>
          <p className="text-sm mb-5" style={{ color: C.muted }}>
            Ajoute pwodwi yo pou w ka kòmande.
          </p>
          <Link href={base} onClick={close} className="inline-block rounded-lg px-6 py-3 font-semibold text-white" style={{ background: C.ink }}>
            Wè pwodwi yo
          </Link>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          {shop.freeDeliveryMin > 0 && (
            <div className="px-5 pt-4">
              <p className="text-sm mb-1.5">
                {toFree > 0 ? (
                  <>
                    Ajoute <b>{money(toFree)}</b> pou livrezon gratis
                  </>
                ) : (
                  <b style={{ color: C.ok }}>Ou jwenn livrezon gratis!</b>
                )}
              </p>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: C.soft }}>
                <div className="h-full rounded-full" style={{ width: `${progress}%`, background: toFree > 0 ? C.red : C.ok }} />
              </div>
            </div>
          )}
          <ul className="flex-1 px-5 py-3 divide-y" style={{ borderColor: C.line }}>
            {cartLines.map((l) => (
              <li key={l.key} className="flex gap-3 py-3" style={{ borderColor: C.line }}>
                <Link href={`${base}/p/${l.p.id}`} onClick={close} className="shrink-0">
                  {l.p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.p.imageUrl} alt="" className="w-16 h-16 rounded-lg object-cover" />
                  ) : (
                    <span className="block w-16 h-16 rounded-lg" style={{ background: C.soft }} />
                  )}
                </Link>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-snug" style={clamp2}>
                    {l.p.name}
                  </p>
                  {(l.size || l.color) && (
                    <p className="text-xs" style={{ color: C.muted }}>
                      {variantLabel(l.size, l.color)}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="flex items-center rounded-lg border" style={{ borderColor: C.line }}>
                      <button aria-label="Mwens" onClick={() => setLineQty(l.key, l.qty - 1)} className="w-8 h-8 flex items-center justify-center">
                        <Minus size={14} />
                      </button>
                      <span className="w-7 text-center text-sm font-semibold tabular-nums">{l.qty}</span>
                      <button
                        aria-label="Plis"
                        onClick={() => setLineQty(l.key, l.qty + 1)}
                        disabled={l.qty >= l.p.stock}
                        className="w-8 h-8 flex items-center justify-center disabled:opacity-30"
                      >
                        <Plus size={14} />
                      </button>
                    </span>
                    <span className="font-bold text-sm tabular-nums">{money(l.p.price * l.qty)}</span>
                  </div>
                </div>
                <button aria-label="Retire" onClick={() => removeLine(l.key)} className="self-start p-1" style={{ color: C.muted }}>
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t px-5 py-4 space-y-3" style={{ borderColor: C.line }}>
            <div className="flex justify-between font-bold text-lg">
              <span>Sou-total</span>
              <span className="tabular-nums">{money(subtotal)}</span>
            </div>
            <p className="text-xs" style={{ color: C.muted }}>
              {fee > 0 ? `Livrezon: ${money(fee)} (kalkile nan checkout)` : "Livrezon gratis"}
            </p>
            <Link
              href={`${base}/peman`}
              onClick={close}
              className="block text-center rounded-lg py-3.5 font-bold text-white"
              style={{ background: C.red }}
            >
              Peye kounye a
            </Link>
            <Link
              href={`${base}/panye`}
              onClick={close}
              className="block text-center rounded-lg py-3 font-semibold border"
              style={{ borderColor: C.ink }}
            >
              Wè panye a
            </Link>
          </div>
        </div>
      )}
    </Sheet>
  );
}

export function ShopChrome({ children }: { children: React.ReactNode }) {
  const { shop, base, itemCount, wishlist, hydrated, cartOpen, setCartOpen, toast, money } = useShop();
  const pathname = usePathname();
  const categories = useMemo(() => [...new Set(shop.products.map((p) => p.category))].sort(), [shop.products]);
  const hasSale = shop.products.some((p) => p.oldPrice);

  const waHello = shop.whatsapp
    ? `https://wa.me/${shop.whatsapp}?text=${encodeURIComponent(`Bonjou ${shop.name}, mwen vle plis enfòmasyon.`)}`
    : null;

  const cartCount = hydrated ? itemCount : 0;
  const wishCount = hydrated ? wishlist.length : 0;

  const iconBtn = "relative flex flex-col items-center gap-0.5 px-2 py-1 text-[11px] font-medium";
  const badge = (n: number) =>
    n > 0 && (
      <span
        className="absolute -top-0.5 right-0 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
        style={{ background: C.red }}
      >
        {n}
      </span>
    );

  const navTab = (href: string, label: string, icon: React.ReactNode, count = 0) => {
    const active = href === base ? pathname === base : pathname.startsWith(href);
    return (
      <Link href={href} className="relative flex-1 flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium" style={{ color: active ? C.red : C.ink }}>
        {icon}
        {label}
        {count > 0 && (
          <span className="absolute top-1.5 left-1/2 ml-2 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center" style={{ background: C.red }}>
            {count}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-white text-[#111111] pb-[calc(3.75rem+env(safe-area-inset-bottom))] md:pb-0">
      {shop.announcement && (
        <div className="text-center text-xs sm:text-sm font-medium py-2 px-4 text-white" style={{ background: C.red }}>
          {shop.announcement}
        </div>
      )}

      <header className="sticky top-0 z-40 bg-white border-b" style={{ borderColor: C.line }}>
        <div className="max-w-7xl mx-auto px-4 pt-[max(0.5rem,env(safe-area-inset-top))] flex items-center gap-3 md:gap-6 h-16">
          <Link href={base} className="flex items-center gap-2.5 shrink-0" aria-label={shop.name}>
            <Logo />
            <span className="hidden sm:block font-bold text-lg leading-tight max-w-[12rem] truncate">{shop.name}</span>
          </Link>
          <div className="hidden md:flex flex-1 min-w-0">
            <SearchBox />
          </div>
          <nav className="ml-auto flex items-center gap-1" aria-label="Kont ak panye">
            <Link href={`${base}/swiv`} className={`${iconBtn} hidden sm:flex`}>
              <Package size={22} />
              Kòmand mwen
            </Link>
            <Link href={`${base}/anvi`} className={`${iconBtn} hidden md:flex`}>
              <Heart size={22} />
              Lis anvi
              {badge(wishCount)}
            </Link>
            <button onClick={() => setCartOpen(true)} className={iconBtn} aria-label="Louvri panye a">
              <ShoppingCart size={22} />
              <span className="hidden sm:inline">Panye</span>
              {badge(cartCount)}
            </button>
          </nav>
        </div>
        <div className="md:hidden px-4 pb-2.5">
          <SearchBox />
        </div>
        <div className="border-t" style={{ borderColor: C.line, background: C.ink }}>
          <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto [scrollbar-width:none] text-sm text-white">
            <Link href={base} className="whitespace-nowrap px-3 py-2.5 font-semibold hover:bg-white/10 rounded">
              Tout pwodwi
            </Link>
            {hasSale && (
              <Link href={`${base}?sale=1`} className="whitespace-nowrap px-3 py-2.5 font-semibold rounded hover:bg-white/10" style={{ color: "#FF8A9B" }}>
                Rabè
              </Link>
            )}
            <Link href={`${base}?sort=new`} className="whitespace-nowrap px-3 py-2.5 font-semibold hover:bg-white/10 rounded">
              Nouvo
            </Link>
            {categories.map((c) => (
              <Link key={c} href={`${base}?cat=${encodeURIComponent(c)}`} className="whitespace-nowrap px-3 py-2.5 hover:bg-white/10 rounded">
                {c}
              </Link>
            ))}
          </div>
        </div>
      </header>

      {children}

      <footer className="mt-16 text-white" style={{ background: C.ink }}>
        <div className="max-w-7xl mx-auto px-4 py-10 grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-3">
              <span className="rounded-full overflow-hidden bg-white text-black w-10 h-10 flex items-center justify-center font-bold">
                {shop.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={shop.logoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  shop.name.trim().charAt(0).toUpperCase()
                )}
              </span>
              <p className="font-bold text-lg">{shop.name}</p>
            </div>
            <p className="text-sm text-white/70 max-w-md whitespace-pre-line">{shop.about || shop.tagline}</p>
          </div>
          <div className="text-sm space-y-2">
            <p className="font-semibold mb-1">Èd</p>
            <Link href={`${base}/swiv`} className="block text-white/70 hover:text-white">
              Swiv kòmand mwen
            </Link>
            <Link href={`${base}/anvi`} className="block text-white/70 hover:text-white">
              Lis anvi mwen
            </Link>
            <Link href={`${base}/panye`} className="block text-white/70 hover:text-white">
              Panye
            </Link>
            {waHello && (
              <a href={waHello} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-white/70 hover:text-white">
                <MessageCircle size={14} /> Kontakte nou sou WhatsApp
              </a>
            )}
          </div>
          <div className="text-sm space-y-2 text-white/70">
            <p className="font-semibold text-white mb-1">Livrezon ak peman</p>
            <p>
              {shop.deliveryFee > 0 ? `Livrezon: ${money(shop.deliveryFee)}` : "Livrezon disponib"}
              {shop.freeDeliveryMin > 0 ? ` — gratis depi ${money(shop.freeDeliveryMin)}` : ""}
            </p>
            {shop.pickup && <p>Ranmase nan boutik la{shop.address ? `: ${shop.address}` : ""}</p>}
            <p>Peman: kach, MonCash, NatCash, transfè bank</p>
            {shop.returns && <p className="whitespace-pre-line">{shop.returns}</p>}
          </div>
        </div>
        <div className="border-t border-white/10 text-center text-xs text-white/50 py-4">© {new Date().getFullYear()} {shop.name}</div>
      </footer>

      {/* Nav anba sou telefòn */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t flex h-[calc(3.75rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)]"
        style={{ borderColor: C.line }}
        aria-label="Navigasyon"
      >
        {navTab(base, "Akèy", <Store size={22} />)}
        {navTab(`${base}/anvi`, "Lis anvi", <Heart size={22} />, wishCount)}
        {navTab(`${base}/swiv`, "Kòmand", <Truck size={22} />)}
        <button
          onClick={() => setCartOpen(true)}
          className="relative flex-1 flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium"
        >
          <ShoppingCart size={22} />
          Panye
          {cartCount > 0 && (
            <span className="absolute top-1.5 left-1/2 ml-2 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center" style={{ background: C.red }}>
              {cartCount}
            </span>
          )}
        </button>
      </nav>

      {cartOpen && <CartDrawer />}

      {toast && (
        <div
          role="status"
          className="fixed left-1/2 -translate-x-1/2 bottom-24 md:bottom-8 z-[70] rounded-lg px-4 py-3 text-sm font-medium text-white shadow-2xl max-w-[90vw]"
          style={{ background: C.ink }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
