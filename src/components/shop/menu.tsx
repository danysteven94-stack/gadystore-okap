"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Clock, Flame, MapPin, Plus, ShoppingBag, Store, Timer, Truck } from "lucide-react";
import type { PublicProduct } from "@/lib/shop";
import { useShop, useT } from "./shop-context";
import { Catalog } from "./catalog";
import { HeroSlides } from "./hero-slides";
import { C, FoodImage } from "./ui";

/** Paj dakèy boutik la: restoran = meni, lòt = katalòg òdinè. */
export function ShopHome() {
  const { shop } = useShop();
  return shop.type === "restaurant" ? <Menu /> : <Catalog />;
}

function slugId(s: string) {
  return "cat-" + s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function Menu() {
  const t = useT();
  const { shop, base, money, itemCount, subtotal, setCartOpen } = useShop();
  const sp = useSearchParams();
  // Rechèch la vini nan bar anlè a (?q=) — se li ki filtre meni an.
  const q = (sp.get("q") ?? "").trim();
  const catParam = sp.get("cat");
  const [active, setActive] = useState<string | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const sections = useMemo(() => {
    const ql = q.toLowerCase();
    const map = new Map<string, PublicProduct[]>();
    for (const p of shop.products) {
      if (ql && !`${p.name} ${p.description ?? ""} ${p.category} ${p.tags.join(" ")}`.toLowerCase().includes(ql)) continue;
      const k = p.category || t("Lòt");
      map.set(k, [...(map.get(k) ?? []), p]);
    }
    return [...map.entries()];
  }, [shop.products, q, t]);

  // Plat vedèt (oswa pi vann) — yon ranje orizontal anlè meni an
  const popular = useMemo(() => {
    const feat = shop.products.filter((p) => p.featured && p.stock > 0);
    const pool = feat.length >= 2 ? feat : [...shop.products].filter((p) => p.sold > 0 && p.stock > 0).sort((a, b) => b.sold - a.sold);
    return pool.slice(0, 10);
  }, [shop.products]);

  // Scroll-spy: kategori ki sou ekran an vin aktif nan bar la
  useEffect(() => {
    if (sections.length < 2) return;
    const els = sections.map(([c]) => document.getElementById(slugId(c))).filter((e): e is HTMLElement => !!e);
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (vis) {
          const cat = sections.find(([c]) => slugId(c) === vis.target.id)?.[0] ?? null;
          setActive(cat);
        }
      },
      { rootMargin: "-140px 0px -65% 0px", threshold: 0 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [sections]);

  // Kenbe chip aktif la vizib nan bar orizontal la
  useEffect(() => {
    if (!active || !barRef.current) return;
    const chip = barRef.current.querySelector<HTMLElement>(`[data-cat="${CSS.escape(active)}"]`);
    chip?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [active]);

  // ?cat=… (lyen ki soti yon lòt kote) → ale dirèk sou seksyon an
  useEffect(() => {
    if (!catParam) return;
    const id = window.setTimeout(() => document.getElementById(slugId(catParam))?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    return () => window.clearTimeout(id);
  }, [catParam]);

  function jump(cat: string) {
    setActive(cat);
    document.getElementById(slugId(cat))?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const searching = q.length > 0;
  const closed = !shop.acceptingOrders;

  return (
    <main className="pb-32 md:pb-16">
      {!searching && <RestaurantHero />}

      <div className="max-w-5xl mx-auto px-4">
        {searching && (
          <div className="pt-5 pb-1 flex items-baseline justify-between gap-3">
            <h1 className="text-lg font-bold">{t("Rezilta pou “{q}”", { q })}</h1>
            <Link href={base} className="text-sm font-semibold underline underline-offset-2">{t("Retire filt")}</Link>
          </div>
        )}

        {/* Plat vedèt */}
        {!searching && popular.length >= 2 && (
          <section className="pt-8">
            <h2 className="flex items-center gap-2 text-xl sm:text-2xl font-extrabold tracking-tight mb-4">
              <Flame size={22} style={{ color: C.red }} /> {t("Pi popilè")}
            </h2>
            <div className="-mx-4 px-4 flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2">
              {popular.map((p) => (
                <PopularCard key={p.id} p={p} />
              ))}
            </div>
          </section>
        )}

        {/* Kategori (kole anlè, anba header a) */}
        {sections.length > 1 && (
          <div
            className="sticky z-30 -mx-4 px-4 mt-6 bg-white/95 backdrop-blur border-b"
            style={{ borderColor: C.line, top: "var(--shop-header-h, 64px)" }}
          >
            <div ref={barRef} className="flex gap-2 overflow-x-auto no-scrollbar py-2.5">
              {sections.map(([cat]) => {
                const on = active === cat;
                return (
                  <button
                    key={cat}
                    data-cat={cat}
                    onClick={() => jump(cat)}
                    className="rounded-full px-4 h-9 text-sm font-semibold whitespace-nowrap border transition-colors"
                    style={on ? { background: C.ink, color: "#fff", borderColor: C.ink } : { borderColor: C.line, background: "#fff", color: "#3A3A3A" }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {sections.length === 0 ? (
          <div className="text-center py-20">
            <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: C.soft }}><ShoppingBag size={26} /></div>
            <p className="text-sm" style={{ color: C.muted }}>{t("Pa gen plat ki koresponn.")}</p>
          </div>
        ) : (
          sections.map(([cat, items]) => (
            <section key={cat} id={slugId(cat)} className="pt-8" style={{ scrollMarginTop: "calc(var(--shop-header-h, 64px) + 56px)" }}>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight mb-4">
                {cat} <span className="text-sm font-semibold align-middle ml-1" style={{ color: C.muted }}>{items.length}</span>
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                {items.map((p) => (
                  <DishCard key={p.id} p={p} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      {/* Bar panye (telefòn) — tankou Uber Eats / DoorDash */}
      {itemCount > 0 && !closed && (
        <div
          className="md:hidden fixed inset-x-0 z-30 px-3"
          style={{ bottom: "calc(3.5rem + env(safe-area-inset-bottom) + 0.5rem)" }}
        >
          <button
            onClick={() => setCartOpen(true)}
            className="w-full h-14 rounded-2xl text-white font-bold flex items-center justify-between px-5 shadow-2xl active:scale-[0.99] transition-transform"
            style={{ background: C.red }}
          >
            <span className="inline-flex items-center gap-2.5">
              <span className="min-w-6 h-6 px-1.5 rounded-full bg-white/25 text-xs flex items-center justify-center tabular-nums">{itemCount}</span>
              {t("Wè panye a")}
            </span>
            <span className="tabular-nums">{money(subtotal)}</span>
          </button>
        </div>
      )}
    </main>
  );
}

/* ------------------------------ Hero restoran ------------------------------ */

function RestaurantHero() {
  const t = useT();
  const { shop, money } = useShop();
  const covers = shop.covers.length ? shop.covers : shop.products.map((p) => p.imageUrl).filter((u): u is string => !!u).slice(0, 4);
  const initial = shop.name.trim().charAt(0).toUpperCase() || "R";

  return (
    <section>
      <div className="relative h-48 sm:h-72 overflow-hidden text-white" style={{ background: `linear-gradient(120deg, ${C.ink} 0%, #2A2A2A 55%, ${C.redDark} 140%)` }}>
        <HeroSlides covers={covers} seconds={shop.slideSeconds} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,.25) 0%, rgba(0,0,0,.05) 40%, rgba(0,0,0,.55) 100%)" }} />
        {shop.heroTitle && (
          <div className="absolute inset-x-0 bottom-14 sm:bottom-20">
            <div className="max-w-5xl mx-auto px-4">
              <h2 className="text-2xl sm:text-5xl font-extrabold leading-tight max-w-2xl drop-shadow">{shop.heroTitle}</h2>
              {shop.heroText && <p className="mt-1 text-sm sm:text-lg max-w-xl opacity-95 drop-shadow line-clamp-2">{shop.heroText}</p>}
            </div>
          </div>
        )}
      </div>

      {/* Kat enfòmasyon ki chevauche hero a */}
      <div className="max-w-5xl mx-auto px-4 -mt-10 sm:-mt-14 relative z-10">
        <div className="rounded-3xl bg-white border shadow-[0_10px_40px_-12px_rgba(0,0,0,.25)] p-4 sm:p-6" style={{ borderColor: C.line }}>
          <div className="flex items-start gap-4">
            <span className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center text-2xl font-bold text-white border" style={{ background: C.ink, borderColor: C.line }}>
              {shop.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={shop.logoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                initial
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight leading-tight">{shop.name}</h1>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold text-white"
                  style={{ background: shop.acceptingOrders ? "#15803D" : C.ink }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  {shop.acceptingOrders ? t("OUVÈ") : t("FÈMEN")}
                </span>
              </div>
              {shop.tagline && <p className="mt-1 text-sm line-clamp-2" style={{ color: C.muted }}>{shop.tagline}</p>}
            </div>
          </div>

          <dl className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3 pt-4 border-t text-sm" style={{ borderColor: C.line }}>
            {shop.prepTime && <Fact icon={<Timer size={18} />} label={t("Preparasyon")} value={shop.prepTime} />}
            {shop.deliveryEnabled && (
              <Fact
                icon={<Truck size={18} />}
                label={t("Livrezon")}
                value={shop.deliveryFee > 0 ? money(shop.deliveryFee) : t("Gratis")}
              />
            )}
            {shop.pickupEnabled && <Fact icon={<Store size={18} />} label={t("Ranmase nan restoran")} value={t("Gratis")} />}
            {shop.hours && <Fact icon={<Clock size={18} />} label={t("Orè")} value={shop.hours} />}
            {shop.address && <Fact icon={<MapPin size={18} />} label={t("Adrès")} value={shop.address} wide />}
          </dl>
        </div>
      </div>
    </section>
  );
}

function Fact({ icon, label, value, wide }: { icon: React.ReactNode; label: string; value: string; wide?: boolean }) {
  return (
    <div className={`flex items-start gap-2.5 min-w-0 ${wide ? "col-span-2" : ""}`}>
      <span className="mt-0.5 shrink-0" style={{ color: C.red }}>{icon}</span>
      <div className="min-w-0">
        <dt className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: C.muted }}>{label}</dt>
        <dd className="font-semibold leading-snug">{value}</dd>
      </div>
    </div>
  );
}

/* ------------------------------ Kat plat yo ------------------------------ */

/** Bouton "+" / "Opsyon" — andedan foto a (pa janm deborde ekran an). */
function AddControl({ p, size = "md" }: { p: PublicProduct; size?: "md" | "sm" }) {
  const t = useT();
  const { shop, base, addToCart, inCartOf } = useShop();
  const out = p.stock <= 0;
  const closed = !shop.acceptingOrders;
  const hasOptions = p.sizes.length > 0 || p.colors.length > 0;
  const qty = inCartOf(p.id);
  if (out || closed) return null;
  const dim = size === "sm" ? "h-9 min-w-9" : "h-10 min-w-10";

  if (hasOptions) {
    return (
      <Link
        href={`${base}/p/${p.id}`}
        aria-label={t("Chwazi opsyon")}
        className={`${dim} px-3.5 rounded-full bg-white text-[13px] font-bold flex items-center justify-center shadow-lg ring-1 ring-black/10 active:scale-95 transition-transform`}
      >
        {qty > 0 ? <span className="mr-1.5 text-white rounded-full px-1.5 text-[11px] leading-5" style={{ background: C.red }}>{qty}</span> : null}
        {t("Opsyon")}
      </Link>
    );
  }
  return (
    <button
      onClick={() => addToCart(p)}
      aria-label={t("Ajoute")}
      className={`${dim} px-2.5 rounded-full text-white font-bold flex items-center justify-center gap-1 shadow-lg active:scale-95 transition-transform`}
      style={{ background: qty > 0 ? C.red : C.ink }}
    >
      {qty > 0 ? <span className="text-sm tabular-nums">{qty}</span> : null}
      <Plus size={18} strokeWidth={2.5} />
    </button>
  );
}

function DishCard({ p }: { p: PublicProduct }) {
  const t = useT();
  const { base, money } = useShop();
  const out = p.stock <= 0;

  return (
    <article className="group relative flex gap-3 rounded-2xl border bg-white p-3 sm:p-4 transition-shadow hover:shadow-lg" style={{ borderColor: C.line }}>
      <Link href={`${base}/p/${p.id}`} className="flex-1 min-w-0 flex flex-col">
        <h3 className="font-bold text-[16px] leading-snug">{p.name}</h3>
        {p.description && <p className="text-sm mt-1 line-clamp-2 leading-snug" style={{ color: C.muted }}>{p.description}</p>}
        {(p.tags.length > 0 || p.prepMinutes > 0) && (
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {p.tags.map((tag) => (
              <span key={tag} className="rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide" style={{ background: C.soft }}>{tag.toUpperCase()}</span>
            ))}
            {p.prepMinutes > 0 && (
              <span className="inline-flex items-center gap-1 text-xs" style={{ color: C.muted }}><Timer size={12} /> {p.prepMinutes} min</span>
            )}
          </div>
        )}
        <p className="mt-auto pt-3 font-extrabold text-[17px] tabular-nums">
          {money(p.price)}
          {p.comparePrice ? <span className="ml-2 text-xs line-through font-normal" style={{ color: C.muted }}>{money(p.comparePrice)}</span> : null}
        </p>
      </Link>

      <div className="relative w-28 h-28 sm:w-36 sm:h-36 shrink-0">
        <Link href={`${base}/p/${p.id}`} aria-label={p.name} className="block w-full h-full">
          <FoodImage src={p.imageUrl} alt={p.name} dim={out} className="w-full h-full rounded-xl" imgClassName="group-hover:scale-105 transition-transform duration-500" />
        </Link>
        {out ? (
          <span className="absolute inset-x-2 bottom-2 rounded-lg text-center text-[11px] font-bold text-white py-1" style={{ background: C.ink }}>
            {t("FINI JODI A")}
          </span>
        ) : (
          <div className="absolute bottom-1.5 right-1.5">
            <AddControl p={p} />
          </div>
        )}
      </div>
    </article>
  );
}

function PopularCard({ p }: { p: PublicProduct }) {
  const { base, money } = useShop();
  return (
    <article className="snap-start shrink-0 w-40 sm:w-52 group">
      <div className="relative">
        <Link href={`${base}/p/${p.id}`} aria-label={p.name} className="block">
          <FoodImage src={p.imageUrl} alt={p.name} className="aspect-square w-full rounded-2xl" imgClassName="group-hover:scale-105 transition-transform duration-500" />
        </Link>
        <div className="absolute bottom-2 right-2">
          <AddControl p={p} size="sm" />
        </div>
      </div>
      <Link href={`${base}/p/${p.id}`} className="block mt-2">
        <h3 className="font-bold text-[14px] leading-snug line-clamp-2">{p.name}</h3>
        <p className="text-sm font-semibold tabular-nums mt-0.5">{money(p.price)}</p>
      </Link>
    </article>
  );
}
