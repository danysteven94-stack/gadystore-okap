"use client";

import Link from "next/link";
import { Bell, Heart, Plus, ShoppingBag } from "lucide-react";
import type { PublicProduct } from "@/lib/shop";
import { useShop, useT } from "./shop-context";
import { C, Price, Stars, clamp2, discountPct, isNew } from "./ui";

export function ProductCard({ p, index = 0 }: { p: PublicProduct; index?: number }) {
  const t = useT();
  const { base, money, inCartOf, addToCart, wish, toggleWish, setNotifyFor } = useShop();
  const out = p.stock <= 0;
  const pct = discountPct(p);
  const liked = wish.includes(p.id);
  const qty = inCartOf(p.id);
  const hasOptions = p.sizes.length > 0 || p.colors.length > 0;

  return (
    <article
      className="group relative rounded-2xl bg-white border flex flex-col overflow-hidden transition-shadow hover:shadow-xl"
      style={{ borderColor: C.line, animation: `fadeUp .45s ease-out ${Math.min(index, 8) * 50}ms both` }}
    >
      <Link href={`${base}/p/${p.id}`} className="relative block aspect-square w-full overflow-hidden" style={{ background: C.soft }} aria-label={p.name}>
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
        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
          {out && <Badge bg={C.ink}>{t("FINI")}</Badge>}
          {!out && pct > 0 && <Badge bg={C.red}>-{pct}%</Badge>}
          {!out && p.stock <= 5 && <Badge bg="#B45309">{t("BALEN")}</Badge>}
          {!out && isNew(p) && <Badge bg={C.ink}>{t("NOUVO")}</Badge>}
        </div>
      </Link>

      <button
        onClick={() => toggleWish(p.id)}
        aria-label={liked ? t("Retire nan favori") : t("Ajoute nan favori")}
        aria-pressed={liked}
        className="absolute top-2 right-2 w-9 h-9 rounded-full bg-white/95 shadow flex items-center justify-center"
      >
        <Heart size={18} color={liked ? C.red : C.ink} fill={liked ? C.red : "none"} />
      </button>

      <div className="p-3 flex flex-col flex-1">
        {p.brand ? (
          <p className="text-[10px] font-semibold tracking-[0.14em] uppercase truncate" style={{ color: C.muted }}>
            {p.brand}
          </p>
        ) : (
          <p className="text-[10px] font-semibold tracking-[0.14em] uppercase truncate" style={{ color: C.muted }}>
            {p.category}
          </p>
        )}
        <Link href={`${base}/p/${p.id}`} className="mt-1">
          <h3 className="text-[14px] font-medium leading-snug min-h-[2.6em]" style={clamp2}>
            {p.name}
          </h3>
        </Link>
        {p.ratingCount > 0 && (
          <div className="mt-1 flex items-center gap-1 text-[11px]" style={{ color: C.muted }}>
            <Stars value={p.rating} size={12} /> ({p.ratingCount})
          </div>
        )}
        <div className="mt-1.5">
          <Price p={p} money={money} />
        </div>
        {p.sold > 0 && (
          <p className="text-[11px] mt-0.5" style={{ color: C.muted }}>
            {t("{n} vann", { n: p.sold.toLocaleString("fr-FR") })}
          </p>
        )}

        <div className="mt-auto pt-3">
          {out ? (
            <button
              onClick={() => setNotifyFor(p)}
              className="w-full h-10 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2"
              style={{ borderColor: C.ink }}
            >
              <Bell size={15} /> {t("Notifye m")}
            </button>
          ) : hasOptions ? (
            <Link
              href={`${base}/p/${p.id}`}
              className="w-full h-10 rounded-xl border-2 text-sm font-semibold flex items-center justify-center"
              style={{ borderColor: C.ink }}
            >
              {t("Chwazi opsyon")}
            </Link>
          ) : (
            <button
              onClick={() => addToCart(p)}
              className="w-full h-10 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-1.5 active:scale-[.98] transition-transform"
              style={{ background: C.ink }}
            >
              <Plus size={16} /> {qty > 0 ? t("Nan panye ({n})", { n: qty }) : t("Ajoute")}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function Badge({ bg, children }: { bg: string; children: React.ReactNode }) {
  return (
    <span className="rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wider text-white" style={{ background: bg }}>
      {children}
    </span>
  );
}

/** Ranje orizontal ak defilman (Shein/Amazon style). */
export function ProductRow({ title, href, products }: { title: string; href?: string; products: PublicProduct[] }) {
  const t = useT();
  if (products.length === 0) return null;
  return (
    <section className="mb-8">
      <div className="flex items-end justify-between mb-3 px-4 max-w-6xl mx-auto">
        <h2 className="text-xl font-semibold">{title}</h2>
        {href && (
          <Link href={href} className="text-sm font-semibold underline underline-offset-2" style={{ color: C.red }}>
            {t("Wè tout")}
          </Link>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto snap-x px-4 pb-2 max-w-6xl mx-auto [scrollbar-width:none]">
        {products.map((p, i) => (
          <div key={p.id} className="w-[44vw] max-w-[220px] sm:w-52 shrink-0 snap-start">
            <ProductCard p={p} index={i} />
          </div>
        ))}
      </div>
    </section>
  );
}
