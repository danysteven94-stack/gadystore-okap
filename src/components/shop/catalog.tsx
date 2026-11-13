"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MessageCircle, ShoppingBag, SlidersHorizontal, X } from "lucide-react";
import { useShop } from "./shop-context";
import { ProductCard, ProductRow } from "./product-card";
import { C, Sheet, SheetHeader, discountPct, fieldClass, fieldStyle, isNew } from "./ui";

type Sort = "relevance" | "popular" | "new" | "priceAsc" | "priceDesc" | "discount" | "rating";
const SORTS: { id: Sort; label: string }[] = [
  { id: "relevance", label: "Rekòmande" },
  { id: "popular", label: "Pi vann" },
  { id: "new", label: "Pi nouvo" },
  { id: "priceAsc", label: "Pri: piti → gwo" },
  { id: "priceDesc", label: "Pri: gwo → piti" },
  { id: "discount", label: "Pi gwo rabè" },
  { id: "rating", label: "Pi bon nòt" },
];
const PAGE = 24;

export function Catalog() {
  const { shop, base } = useShop();
  const router = useRouter();
  const sp = useSearchParams();
  const q = (sp.get("q") ?? "").trim();
  const cat = sp.get("cat");
  const saleOnly = sp.get("sale") === "1";

  const [sort, setSort] = useState<Sort>("relevance");
  const [inStock, setInStock] = useState(false);
  const [minP, setMinP] = useState("");
  const [maxP, setMaxP] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [limit, setLimit] = useState(PAGE);

  useEffect(() => setLimit(PAGE), [q, cat, saleOnly, sort, inStock, minP, maxP]);

  const categories = useMemo(() => {
    const map = new Map<string, { count: number; image: string | null }>();
    for (const p of shop.products) {
      const e = map.get(p.category) ?? { count: 0, image: null };
      e.count++;
      if (!e.image && p.imageUrl) e.image = p.imageUrl;
      map.set(p.category, e);
    }
    return [...map.entries()].sort((a, b) => b[1].count - a[1].count);
  }, [shop.products]);

  const browsing = !!(q || cat || saleOnly);

  const list = useMemo(() => {
    const ql = q.toLowerCase();
    const lo = minP === "" ? null : Number(minP);
    const hi = maxP === "" ? null : Number(maxP);
    const r = shop.products.filter(
      (p) =>
        (!cat || p.category === cat) &&
        (!ql || `${p.name} ${p.brand} ${p.category} ${p.description ?? ""}`.toLowerCase().includes(ql)) &&
        (!inStock || p.stock > 0) &&
        (!saleOnly || discountPct(p) > 0) &&
        (lo === null || p.price >= lo) &&
        (hi === null || p.price <= hi)
    );
    const by: Record<Sort, ((a: typeof r[number], b: typeof r[number]) => number) | null> = {
      relevance: null,
      popular: (a, b) => b.sold - a.sold,
      new: (a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""),
      priceAsc: (a, b) => a.price - b.price,
      priceDesc: (a, b) => b.price - a.price,
      discount: (a, b) => discountPct(b) - discountPct(a),
      rating: (a, b) => b.rating - a.rating || b.ratingCount - a.ratingCount,
    };
    const fn = by[sort];
    return fn ? [...r].sort(fn) : r;
  }, [shop.products, q, cat, saleOnly, sort, inStock, minP, maxP]);

  const deals = useMemo(() => [...shop.products].filter((p) => discountPct(p) > 0 && p.stock > 0).sort((a, b) => discountPct(b) - discountPct(a)).slice(0, 12), [shop.products]);
  const fresh = useMemo(() => shop.products.filter((p) => isNew(p) && p.stock > 0).slice(0, 12), [shop.products]);
  const best = useMemo(() => [...shop.products].filter((p) => p.sold > 0).sort((a, b) => b.sold - a.sold).slice(0, 12), [shop.products]);
  const featured = useMemo(() => shop.products.filter((p) => p.featured && p.stock > 0).slice(0, 12), [shop.products]);

  const activeFilters = (inStock ? 1 : 0) + (minP !== "" || maxP !== "" ? 1 : 0);
  const title = q ? `Rezilta pou “${q}”` : cat ? cat : saleOnly ? "Promosyon" : "Tout pwodwi";
  const waHello = shop.whatsapp
    ? `https://wa.me/${shop.whatsapp}?text=${encodeURIComponent(`Bonjou ${shop.name}, mwen vle plis enfòmasyon.`)}`
    : null;

  return (
    <main>
      {!browsing && (
        <>
          {/* ---------- Hero ---------- */}
          <section className="relative overflow-hidden text-white" style={{ background: C.ink }}>
            {shop.coverUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shop.coverUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
            )}
            <div
              className="absolute inset-0"
              style={{
                background: shop.coverUrl
                  ? "linear-gradient(90deg, rgba(0,0,0,.78) 0%, rgba(0,0,0,.45) 60%, rgba(0,0,0,.2) 100%)"
                  : `linear-gradient(120deg, ${C.ink} 0%, #2A2A2A 55%, ${C.redDark} 140%)`,
              }}
            />
            <div className="relative max-w-6xl mx-auto px-4 py-12 sm:py-20">
              <p className="text-[11px] sm:text-xs tracking-[0.3em] uppercase opacity-80 mb-3">{shop.tagline}</p>
              <h1 className="text-4xl sm:text-6xl font-bold leading-tight max-w-2xl">{shop.name}</h1>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href="#tout" className="rounded-full px-7 py-3.5 text-sm font-bold text-white" style={{ background: C.red }}>
                  Achte kounye a
                </a>
                {waHello && (
                  <a href={waHello} target="_blank" rel="noreferrer" className="rounded-full px-6 py-3.5 text-sm font-semibold bg-white/15 backdrop-blur border border-white/30 inline-flex items-center gap-2">
                    <MessageCircle size={16} /> Kontakte nou
                  </a>
                )}
              </div>
            </div>
          </section>

          {/* ---------- Kategori ---------- */}
          {categories.length > 1 && (
            <section className="max-w-6xl mx-auto px-4 pt-7 pb-2">
              <div className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none]">
                {categories.map(([name, info]) => (
                  <Link key={name} href={`${base}?cat=${encodeURIComponent(name)}`} className="shrink-0 w-[76px] text-center">
                    <span className="block w-[76px] h-[76px] rounded-full overflow-hidden border" style={{ borderColor: C.line, background: C.soft }}>
                      {info.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={info.image} alt="" className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <span className="w-full h-full flex items-center justify-center" style={{ color: C.line }}><ShoppingBag size={26} /></span>
                      )}
                    </span>
                    <span className="block mt-1.5 text-xs font-medium leading-tight line-clamp-2">{name}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <div className="pt-6">
            <ProductRow title="⭐ Vedèt" products={featured} />
            <ProductRow title="🔥 Promosyon" href={`${base}?sale=1`} products={deals} />
            <ProductRow title="🆕 Nouvo" products={fresh} />
            <ProductRow title="🏆 Pi vann" products={best} />
          </div>
        </>
      )}

      {/* ---------- Tout pwodwi / rezilta ---------- */}
      <section id="tout" className="max-w-6xl mx-auto px-4 pt-6 scroll-mt-32">
        {browsing && (
          <div className="flex flex-wrap items-center gap-2 mb-3 text-sm">
            <Link href={base} className="underline underline-offset-2" style={{ color: C.muted }}>Akèy</Link>
            <span style={{ color: C.muted }}>/</span>
            <span className="font-semibold">{title}</span>
            <button onClick={() => router.push(base)} className="ml-1 inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: C.line }}>
              <X size={12} /> Retire filt
            </button>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-2xl font-bold">{title}</h2>
            <p className="text-xs" style={{ color: C.muted }}>{list.length} rezilta</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setFilterOpen(true)} className="h-10 rounded-full border px-4 text-sm font-semibold inline-flex items-center gap-2" style={{ borderColor: C.line }}>
              <SlidersHorizontal size={16} /> Filt{activeFilters > 0 && <span className="w-5 h-5 rounded-full text-[11px] text-white flex items-center justify-center" style={{ background: C.red }}>{activeFilters}</span>}
            </button>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              aria-label="Triye"
              className="h-10 rounded-full border bg-white px-3 text-sm font-semibold focus:outline-none"
              style={{ borderColor: C.line }}
            >
              {SORTS.map((s) => (<option key={s.id} value={s.id}>{s.label}</option>))}
            </select>
          </div>
        </div>

        {list.length === 0 ? (
          <div className="text-center py-20">
            <p className="mb-4" style={{ color: C.muted }}>
              {shop.products.length === 0 ? "Poko gen pwodwi nan boutik la." : "Okenn pwodwi pa matche."}
            </p>
            {browsing && (
              <button onClick={() => { setInStock(false); setMinP(""); setMaxP(""); router.push(base); }} className="rounded-xl px-6 py-3 font-semibold text-white" style={{ background: C.ink }}>
                Wè tout pwodwi yo
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
              {list.slice(0, limit).map((p, i) => (<ProductCard key={p.id} p={p} index={i} />))}
            </div>
            {list.length > limit && (
              <div className="text-center mt-8">
                <button onClick={() => setLimit((n) => n + PAGE)} className="rounded-full border-2 px-8 py-3 font-bold" style={{ borderColor: C.ink }}>
                  Wè plis ({list.length - limit})
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {filterOpen && (
        <Sheet onClose={() => setFilterOpen(false)}>
          <SheetHeader title="Filt" onClose={() => setFilterOpen(false)} />
          <div className="space-y-5">
            <div>
              <p className="text-sm font-semibold mb-2">Pri ({shop.currency})</p>
              <div className="flex items-center gap-2">
                <input className={fieldClass} style={fieldStyle} inputMode="numeric" placeholder="Min" value={minP} onChange={(e) => setMinP(e.target.value.replace(/[^\d.]/g, ""))} />
                <span>–</span>
                <input className={fieldClass} style={fieldStyle} inputMode="numeric" placeholder="Max" value={maxP} onChange={(e) => setMaxP(e.target.value.replace(/[^\d.]/g, ""))} />
              </div>
            </div>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-semibold">Sèlman sa ki disponib</span>
              <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} className="w-5 h-5 accent-red-600" />
            </label>
            {categories.length > 1 && (
              <div>
                <p className="text-sm font-semibold mb-2">Kategori</p>
                <div className="flex flex-wrap gap-2">
                  {categories.map(([name]) => (
                    <button
                      key={name}
                      onClick={() => { router.push(cat === name ? base : `${base}?cat=${encodeURIComponent(name)}`); setFilterOpen(false); }}
                      className="rounded-full border px-4 py-2 text-sm font-medium"
                      style={cat === name ? { background: C.ink, color: "#fff", borderColor: C.ink } : { borderColor: C.line }}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <button onClick={() => { setInStock(false); setMinP(""); setMaxP(""); }} className="flex-1 min-h-[48px] rounded-xl border font-semibold" style={{ borderColor: C.line }}>Reyinisyalize</button>
              <button onClick={() => setFilterOpen(false)} className="flex-1 min-h-[48px] rounded-xl font-bold text-white" style={{ background: C.ink }}>Wè {list.length} pwodwi</button>
            </div>
          </div>
        </Sheet>
      )}
    </main>
  );
}
