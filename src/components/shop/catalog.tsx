"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MessageCircle, SlidersHorizontal, Store, Truck, Wallet, X } from "lucide-react";
import { useShop } from "./shop-provider";
import { ProductCard, ProductRow } from "./product-card";
import { C, Sheet } from "./ui";
import { discountPct } from "@/lib/shop-utils";
import type { PublicProduct } from "@/lib/shop";

const PAGE = 24;

const SORTS: { v: string; label: string }[] = [
  { v: "rec", label: "Rekòmande" },
  { v: "new", label: "Pi nouvo" },
  { v: "price_asc", label: "Pri: piti rive gwo" },
  { v: "price_desc", label: "Pri: gwo rive piti" },
  { v: "deal", label: "Pi gwo rabè" },
  { v: "rated", label: "Pi byen nòte" },
];

function sortProducts(list: PublicProduct[], sort: string) {
  const a = [...list];
  const t = (p: PublicProduct) => (p.createdAt ? Date.parse(p.createdAt) || 0 : 0);
  switch (sort) {
    case "new":
      return a.sort((x, y) => t(y) - t(x));
    case "price_asc":
      return a.sort((x, y) => x.price - y.price);
    case "price_desc":
      return a.sort((x, y) => y.price - x.price);
    case "deal":
      return a.sort((x, y) => discountPct(y.price, y.oldPrice) - discountPct(x.price, x.oldPrice));
    case "rated":
      return a.sort((x, y) => y.rating - x.rating || y.ratingCount - x.ratingCount);
    default:
      return a;
  }
}

interface Filters {
  q: string;
  cat: string;
  brand: string;
  min: number;
  max: number;
  stock: boolean;
  sale: boolean;
  sort: string;
}

function FilterPanel({
  f,
  set,
  categories,
  brands,
  counts,
  onDone,
}: {
  f: Filters;
  set: (patch: Record<string, string | null>) => void;
  categories: string[];
  brands: string[];
  counts: Map<string, number>;
  onDone?: () => void;
}) {
  const [min, setMin] = useState(f.min ? String(f.min) : "");
  const [max, setMax] = useState(f.max ? String(f.max) : "");
  const radio = (checked: boolean) => (
    <span
      className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
      style={{ borderColor: checked ? C.ink : "#BDBDBD" }}
    >
      {checked && <span className="w-2 h-2 rounded-full" style={{ background: C.ink }} />}
    </span>
  );
  const inp = "w-full rounded-lg border px-2.5 py-2 text-sm focus:outline-none focus:border-black";

  return (
    <div className="space-y-6 text-sm">
      <div>
        <h3 className="font-bold mb-2">Kategori</h3>
        <ul className="space-y-1">
          <li>
            <button onClick={() => set({ cat: null })} className="flex items-center gap-2 py-1 w-full text-left">
              {radio(!f.cat)} Tout
            </button>
          </li>
          {categories.map((c) => (
            <li key={c}>
              <button onClick={() => set({ cat: c })} className="flex items-center gap-2 py-1 w-full text-left">
                {radio(f.cat === c)}
                <span className="flex-1">{c}</span>
                <span style={{ color: C.muted }}>{counts.get(c) ?? 0}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {brands.length > 0 && (
        <div>
          <h3 className="font-bold mb-2">Mak</h3>
          <ul className="space-y-1">
            <li>
              <button onClick={() => set({ brand: null })} className="flex items-center gap-2 py-1 w-full text-left">
                {radio(!f.brand)} Tout
              </button>
            </li>
            {brands.map((b) => (
              <li key={b}>
                <button onClick={() => set({ brand: b })} className="flex items-center gap-2 py-1 w-full text-left">
                  {radio(f.brand === b)} {b}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h3 className="font-bold mb-2">Pri</h3>
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            set({ min: Number(min) > 0 ? min : null, max: Number(max) > 0 ? max : null });
            onDone?.();
          }}
        >
          <input className={inp} type="number" min={0} inputMode="numeric" placeholder="Min" value={min} onChange={(e) => setMin(e.target.value)} style={{ borderColor: C.line, minHeight: 0 }} />
          <span>-</span>
          <input className={inp} type="number" min={0} inputMode="numeric" placeholder="Max" value={max} onChange={(e) => setMax(e.target.value)} style={{ borderColor: C.line, minHeight: 0 }} />
          <button type="submit" className="rounded-lg px-3 py-2 font-semibold text-white" style={{ background: C.ink }}>
            OK
          </button>
        </form>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={f.stock} onChange={(e) => set({ stock: e.target.checked ? "1" : null })} className="w-4 h-4" />
          Disponib sèlman
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={f.sale} onChange={(e) => set({ sale: e.target.checked ? "1" : null })} className="w-4 h-4" />
          An rabè
        </label>
      </div>
    </div>
  );
}

export function Catalog() {
  const { shop, base, money } = useShop();
  const router = useRouter();
  const sp = useSearchParams();
  const [shown, setShown] = useState(PAGE);
  const [sheet, setSheet] = useState(false);

  const f: Filters = {
    q: sp.get("q") ?? "",
    cat: sp.get("cat") ?? "",
    brand: sp.get("brand") ?? "",
    min: Number(sp.get("min")) || 0,
    max: Number(sp.get("max")) || 0,
    stock: sp.get("stock") === "1",
    sale: sp.get("sale") === "1",
    sort: sp.get("sort") ?? "rec",
  };
  const filtering = !!(f.q || f.cat || f.brand || f.min || f.max || f.stock || f.sale || f.sort !== "rec");

  function set(patch: Record<string, string | null>) {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    setShown(PAGE);
    router.replace(`${base}${next.toString() ? `?${next}` : ""}`, { scroll: false });
  }

  const products = shop.products;
  const categories = useMemo(() => [...new Set(products.map((p) => p.category))].sort(), [products]);
  const brands = useMemo(() => [...new Set(products.map((p) => p.brand).filter((b): b is string => !!b))].sort(), [products]);
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of products) m.set(p.category, (m.get(p.category) ?? 0) + 1);
    return m;
  }, [products]);

  const results = useMemo(() => {
    const t = f.q.trim().toLowerCase();
    const list = products.filter(
      (p) =>
        (!t || `${p.name} ${p.brand ?? ""} ${p.category} ${p.description ?? ""}`.toLowerCase().includes(t)) &&
        (!f.cat || p.category === f.cat) &&
        (!f.brand || p.brand === f.brand) &&
        (!f.min || p.price >= f.min) &&
        (!f.max || p.price <= f.max) &&
        (!f.stock || p.stock > 0) &&
        (!f.sale || !!p.oldPrice)
    );
    return sortProducts(list, f.sort);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, f.q, f.cat, f.brand, f.min, f.max, f.stock, f.sale, f.sort]);

  const deals = useMemo(() => sortProducts(products.filter((p) => p.oldPrice && p.stock > 0), "deal").slice(0, 12), [products]);
  const fresh = useMemo(() => sortProducts(products.filter((p) => p.stock > 0 && p.createdAt), "new").slice(0, 12), [products]);
  const top = useMemo(() => sortProducts(products.filter((p) => p.ratingCount > 0 && p.rating >= 4), "rated").slice(0, 12), [products]);
  const tiles = useMemo(
    () => categories.map((c) => ({ c, img: products.find((p) => p.category === c && p.imageUrl)?.imageUrl ?? null, n: counts.get(c) ?? 0 })),
    [categories, products, counts]
  );

  const activeChips: { label: string; clear: Record<string, string | null> }[] = [];
  if (f.q) activeChips.push({ label: `“${f.q}”`, clear: { q: null } });
  if (f.cat) activeChips.push({ label: f.cat, clear: { cat: null } });
  if (f.brand) activeChips.push({ label: f.brand, clear: { brand: null } });
  if (f.min || f.max) activeChips.push({ label: `${f.min ? money(f.min) : "0"} - ${f.max ? money(f.max) : "…"}`, clear: { min: null, max: null } });
  if (f.stock) activeChips.push({ label: "Disponib", clear: { stock: null } });
  if (f.sale) activeChips.push({ label: "An rabè", clear: { sale: null } });

  const trust: { icon: React.ReactNode; title: string; text: string }[] = [
    {
      icon: <Truck size={22} />,
      title: "Livrezon",
      text:
        shop.freeDeliveryMin > 0
          ? `Gratis depi ${money(shop.freeDeliveryMin)}`
          : shop.deliveryFee > 0
          ? `${money(shop.deliveryFee)} pou chak kòmand`
          : "Nou livre kòmand ou",
    },
    ...(shop.pickup ? [{ icon: <Store size={22} />, title: "Ranmase", text: "Vin pran kòmand ou nan boutik la" }] : []),
    { icon: <Wallet size={22} />, title: "Peman fasil", text: "Kach, MonCash, NatCash, bank" },
    ...(shop.whatsapp ? [{ icon: <MessageCircle size={22} />, title: "Sipò", text: "Reponn ou sou WhatsApp" }] : []),
  ];

  const title = f.q ? `Rezilta pou “${f.q}”` : f.cat ? f.cat : f.sale ? "Rabè" : f.sort === "new" ? "Nouvo pwodwi" : "Tout pwodwi";

  return (
    <main className="max-w-7xl mx-auto px-4 pt-4">
      {!filtering && (
        <>
          <section
            className="relative rounded-2xl overflow-hidden text-white mb-5"
            style={{ background: C.ink, minHeight: "15rem" }}
          >
            {shop.coverUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shop.coverUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent" />
            {!shop.coverUrl && <div className="absolute -right-10 -bottom-10 w-72 h-72 rounded-full" style={{ background: C.red }} />}
            <div className="relative px-6 sm:px-10 py-10 sm:py-14 max-w-xl">
              <h1 className="text-3xl sm:text-5xl font-extrabold leading-[1.05] tracking-tight">{shop.name}</h1>
              <p className="mt-3 text-base sm:text-lg text-white/85">{shop.tagline}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href="#pwodwi" className="rounded-lg px-6 py-3 font-bold text-white" style={{ background: C.red }}>
                  Achte kounye a
                </a>
                {deals.length > 0 && (
                  <Link href={`${base}?sale=1`} className="rounded-lg px-6 py-3 font-bold bg-white text-black">
                    Wè rabè yo
                  </Link>
                )}
              </div>
            </div>
          </section>

          <ul className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {trust.map((t) => (
              <li key={t.title} className="flex items-center gap-3 rounded-xl border px-4 py-3" style={{ borderColor: C.line }}>
                <span style={{ color: C.red }}>{t.icon}</span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold">{t.title}</span>
                  <span className="block text-xs leading-snug" style={{ color: C.muted }}>
                    {t.text}
                  </span>
                </span>
              </li>
            ))}
          </ul>

          {tiles.length > 1 && (
            <section className="mb-10">
              <h2 className="text-xl font-bold mb-3">Achte pa kategori</h2>
              <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 -mx-4 px-4 [scrollbar-width:none]">
                {tiles.map((t) => (
                  <Link key={t.c} href={`${base}?cat=${encodeURIComponent(t.c)}`} className="shrink-0 w-28 sm:w-36 text-center group">
                    <span className="block aspect-square rounded-full overflow-hidden border" style={{ background: C.soft, borderColor: C.line }}>
                      {t.img && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={t.img} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      )}
                    </span>
                    <span className="block mt-2 text-sm font-semibold leading-tight">{t.c}</span>
                    <span className="block text-xs" style={{ color: C.muted }}>
                      {t.n} pwodwi
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <ProductRow title="Rabè" products={deals} href={`${base}?sale=1`} />
          <ProductRow title="Nouvo" products={fresh} href={`${base}?sort=new`} />
          <ProductRow title="Pi byen nòte pa kliyan yo" products={top} href={`${base}?sort=rated`} />
        </>
      )}

      <section id="pwodwi" className="scroll-mt-40">
        <div className="flex items-end justify-between gap-3 mb-3">
          <div>
            <h2 className="text-xl font-bold">{title}</h2>
            <p className="text-sm" style={{ color: C.muted }}>
              {results.length} pwodwi
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setSheet(true)} className="lg:hidden inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold" style={{ borderColor: C.ink }}>
              <SlidersHorizontal size={16} /> Filt
            </button>
            <select
              aria-label="Tri"
              value={f.sort}
              onChange={(e) => set({ sort: e.target.value === "rec" ? null : e.target.value })}
              className="rounded-lg border px-3 py-2 text-sm font-medium bg-white"
              style={{ borderColor: C.line, minHeight: 0 }}
            >
              {SORTS.map((s) => (
                <option key={s.v} value={s.v}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {activeChips.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {activeChips.map((c) => (
              <button
                key={c.label}
                onClick={() => set(c.clear)}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold"
                style={{ background: C.soft }}
              >
                {c.label} <X size={12} />
              </button>
            ))}
            <button onClick={() => router.replace(base, { scroll: false })} className="text-xs font-semibold underline px-1" style={{ color: C.red }}>
              Efase tout
            </button>
          </div>
        )}

        <div className="lg:grid lg:grid-cols-[14rem_1fr] lg:gap-8">
          <aside className="hidden lg:block">
            <FilterPanel key={sp.toString()} f={f} set={set} categories={categories} brands={brands} counts={counts} />
          </aside>
          <div>
            {results.length === 0 ? (
              <div className="py-20 text-center">
                <p className="font-bold text-lg mb-1">Pa gen pwodwi ki matche</p>
                <p className="text-sm mb-5" style={{ color: C.muted }}>
                  Eseye yon lòt mo oswa retire kèk filt.
                </p>
                <button onClick={() => router.replace(base, { scroll: false })} className="rounded-lg px-6 py-3 font-semibold text-white" style={{ background: C.ink }}>
                  Wè tout pwodwi yo
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-3 gap-y-7 sm:gap-x-5">
                  {results.slice(0, shown).map((p) => (
                    <ProductCard key={p.id} p={p} />
                  ))}
                </div>
                {results.length > shown && (
                  <div className="text-center mt-10">
                    <button
                      onClick={() => setShown((n) => n + PAGE)}
                      className="rounded-lg border-2 px-8 py-3 font-bold"
                      style={{ borderColor: C.ink }}
                    >
                      Wè plis ({results.length - shown})
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {sheet && (
        <Sheet title="Filt" onClose={() => setSheet(false)}>
          <div className="p-5">
            <FilterPanel key={sp.toString()} f={f} set={set} categories={categories} brands={brands} counts={counts} onDone={() => setSheet(false)} />
            <button onClick={() => setSheet(false)} className="mt-6 w-full rounded-lg py-3 font-bold text-white" style={{ background: C.ink }}>
              Wè {results.length} pwodwi
            </button>
          </div>
        </Sheet>
      )}
    </main>
  );
}
