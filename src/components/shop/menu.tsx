"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Clock, MapPin, Plus, Search, Timer } from "lucide-react";
import type { PublicProduct } from "@/lib/shop";
import { useShop, useT } from "./shop-context";
import { Catalog } from "./catalog";
import { C } from "./ui";

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
  const { shop, money } = useShop();
  const [q, setQ] = useState("");
  const [active, setActive] = useState<string | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const sections = useMemo(() => {
    const ql = q.trim().toLowerCase();
    const map = new Map<string, PublicProduct[]>();
    for (const p of shop.products) {
      if (ql && !`${p.name} ${p.description ?? ""} ${p.tags.join(" ")}`.toLowerCase().includes(ql)) continue;
      const k = p.category || t("Lòt");
      map.set(k, [...(map.get(k) ?? []), p]);
    }
    return [...map.entries()];
  }, [shop.products, q, t]);

  function jump(cat: string) {
    setActive(cat);
    document.getElementById(slugId(cat))?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <main className="max-w-3xl mx-auto px-4 pb-28">
      {/* Enfòmasyon restoran */}
      <section className="py-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm" style={{ color: C.muted }}>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-white"
            style={{ background: shop.acceptingOrders ? "#15803D" : C.ink }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            {shop.acceptingOrders ? t("OUVÈ") : t("FÈMEN")}
          </span>
          {shop.prepTime && <span className="inline-flex items-center gap-1.5"><Timer size={14} /> {shop.prepTime}</span>}
          {shop.hours && <span className="inline-flex items-center gap-1.5"><Clock size={14} /> {shop.hours}</span>}
          {shop.address && <span className="inline-flex items-center gap-1.5"><MapPin size={14} /> {shop.address}</span>}
        </div>
        {(shop.deliveryEnabled || shop.pickupEnabled) && (
          <p className="mt-2 text-xs" style={{ color: C.muted }}>
            {[shop.deliveryEnabled ? t("Livrezon") : null, shop.pickupEnabled ? t("Ranmase nan restoran") : null].filter(Boolean).join(" · ")}
            {shop.deliveryEnabled && shop.deliveryFee > 0 ? ` · ${t("Frè livrezon")}: ${money(shop.deliveryFee)}` : ""}
          </p>
        )}
      </section>

      {/* Rechèch */}
      <div className="relative mb-3">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: C.muted }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("Chèche yon plat...")}
          className="w-full h-11 rounded-full border pl-10 pr-4 text-[15px] bg-white text-[#111111] placeholder:text-[#6B6B6B] dark:bg-white dark:text-[#111111] focus:outline-none"
          style={{ borderColor: C.line }}
        />
      </div>

      {/* Kategori (kole anlè) */}
      {sections.length > 1 && (
        <div ref={barRef} className="sticky top-16 z-30 -mx-4 px-4 py-2 bg-white border-b overflow-x-auto no-scrollbar" style={{ borderColor: C.line }}>
          <div className="flex gap-2 w-max">
            {sections.map(([cat]) => (
              <button
                key={cat}
                onClick={() => jump(cat)}
                className="rounded-full px-4 py-1.5 text-sm font-semibold whitespace-nowrap border"
                style={active === cat ? { background: C.ink, color: "#fff", borderColor: C.ink } : { borderColor: C.line }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {sections.length === 0 ? (
        <p className="text-center py-16 text-sm" style={{ color: C.muted }}>{t("Pa gen plat ki koresponn.")}</p>
      ) : (
        sections.map(([cat, items]) => (
          <section key={cat} id={slugId(cat)} className="pt-6 scroll-mt-32">
            <h2 className="text-xl font-extrabold mb-3">{cat}</h2>
            <div className="divide-y" style={{ borderColor: C.line }}>
              {items.map((p) => (
                <DishRow key={p.id} p={p} />
              ))}
            </div>
          </section>
        ))
      )}
    </main>
  );
}

function DishRow({ p }: { p: PublicProduct }) {
  const t = useT();
  const { shop, base, money, addToCart, inCartOf } = useShop();
  const out = p.stock <= 0;
  const hasOptions = p.sizes.length > 0 || p.colors.length > 0;
  const qty = inCartOf(p.id);
  const closed = !shop.acceptingOrders;

  return (
    <article className="flex gap-3 py-4">
      <Link href={`${base}/p/${p.id}`} className="flex-1 min-w-0">
        <h3 className="font-bold text-[16px] leading-snug">{p.name}</h3>
        {p.description && <p className="text-sm mt-0.5 line-clamp-2" style={{ color: C.muted }}>{p.description}</p>}
        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
          {p.tags.map((tag) => (
            <span key={tag} className="rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide" style={{ background: C.soft }}>{tag.toUpperCase()}</span>
          ))}
          {p.prepMinutes > 0 && (
            <span className="inline-flex items-center gap-1 text-xs" style={{ color: C.muted }}><Timer size={12} /> {p.prepMinutes} min</span>
          )}
        </div>
        <p className="mt-2 font-extrabold text-[16px]">
          {money(p.price)}
          {p.comparePrice ? <span className="ml-2 text-xs line-through font-normal" style={{ color: C.muted }}>{money(p.comparePrice)}</span> : null}
        </p>
      </Link>

      <div className="relative w-28 h-28 shrink-0">
        <Link href={`${base}/p/${p.id}`} className="block w-full h-full rounded-2xl overflow-hidden" style={{ background: C.soft }} aria-label={p.name}>
          {p.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.imageUrl} alt={p.name} loading="lazy" className={`w-full h-full object-cover ${out ? "grayscale opacity-60" : ""}`} />
          )}
        </Link>
        {out ? (
          <span className="absolute inset-x-2 bottom-2 rounded-lg text-center text-[11px] font-bold text-white py-1" style={{ background: C.ink }}>
            {t("FINI JODI A")}
          </span>
        ) : closed ? null : hasOptions ? (
          <Link
            href={`${base}/p/${p.id}`}
            aria-label={t("Chwazi opsyon")}
            className="absolute -bottom-2 -right-2 h-9 px-3 rounded-full bg-white border-2 text-xs font-bold flex items-center shadow"
            style={{ borderColor: C.ink }}
          >
            {t("Opsyon")}
          </Link>
        ) : (
          <button
            onClick={() => addToCart(p)}
            aria-label={t("Ajoute")}
            className="absolute -bottom-2 -right-2 min-w-9 h-9 px-2 rounded-full text-white font-bold flex items-center justify-center gap-1 shadow active:scale-95 transition-transform"
            style={{ background: C.ink }}
          >
            {qty > 0 ? <span className="text-sm">{qty}</span> : null}
            <Plus size={16} />
          </button>
        )}
      </div>
    </article>
  );
}
