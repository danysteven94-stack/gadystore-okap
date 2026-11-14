"use client";

import Link from "next/link";
import { Heart, ShoppingCart } from "lucide-react";
import type { PublicProduct } from "@/lib/shop";
import { discountPct } from "@/lib/shop-utils";
import { useShop } from "./shop-provider";
import { C, PriceBlock, Stars, clamp2 } from "./ui";

export function ProductCard({ p, compact }: { p: PublicProduct; compact?: boolean }) {
  const { base, money, wishlist, toggleWish, addToCart, setCartOpen, hydrated } = useShop();
  const out = p.stock <= 0;
  const low = !out && p.stock <= 5;
  const pct = discountPct(p.price, p.oldPrice);
  const wished = hydrated && wishlist.includes(p.id);
  const needsOptions = p.sizes.length > 0 || p.colors.length > 0;
  const href = `${base}/p/${p.id}`;

  return (
    <article className="group relative flex flex-col bg-white">
      <Link href={href} className="relative block aspect-[4/5] overflow-hidden rounded-lg" style={{ background: C.soft }} aria-label={p.name}>
        {p.imageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.imageUrl}
              alt={p.name}
              loading="lazy"
              className={`absolute inset-0 w-full h-full object-cover ${out ? "grayscale opacity-60" : ""}`}
            />
            {p.images[1] && !out && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.images[1]}
                alt=""
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover opacity-0 md:group-hover:opacity-100 transition-opacity duration-200"
              />
            )}
          </>
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-xs" style={{ color: C.muted }}>
            Pa gen foto
          </span>
        )}
        <span className="absolute top-2 left-2 flex flex-col gap-1 items-start">
          {pct > 0 && !out && (
            <span className="rounded px-2 py-0.5 text-[11px] font-bold text-white" style={{ background: C.red }}>
              -{pct}%
            </span>
          )}
          {low && (
            <span className="rounded px-2 py-0.5 text-[11px] font-bold bg-white border" style={{ borderColor: C.ink }}>
              {p.stock} rete
            </span>
          )}
        </span>
        {out && (
          <span className="absolute bottom-2 left-2 rounded px-2 py-0.5 text-[11px] font-bold text-white" style={{ background: C.ink }}>
            Fini
          </span>
        )}
      </Link>

      <button
        onClick={() => toggleWish(p.id)}
        aria-label={wished ? "Retire nan lis anvi" : "Ajoute nan lis anvi"}
        aria-pressed={wished}
        className="absolute top-2 right-2 w-9 h-9 rounded-full bg-white/95 shadow flex items-center justify-center"
      >
        <Heart size={18} color={wished ? C.red : C.ink} fill={wished ? C.red : "none"} />
      </button>

      <div className="pt-2.5 flex flex-col flex-1">
        {p.brand && (
          <p className="text-[11px] font-semibold truncate" style={{ color: C.muted }}>
            {p.brand}
          </p>
        )}
        <Link href={href} className="text-sm leading-snug hover:underline" style={{ ...clamp2, minHeight: "2.6em" }}>
          {p.name}
        </Link>
        {p.ratingCount > 0 && (
          <span className="mt-1 flex items-center gap-1 text-xs" style={{ color: C.muted }}>
            <Stars value={p.rating} size={12} /> ({p.ratingCount})
          </span>
        )}
        <div className="mt-1.5 flex items-end justify-between gap-2">
          <PriceBlock price={p.price} oldPrice={p.oldPrice} money={money} />
          {!out &&
            (needsOptions ? (
              <Link
                href={href}
                className="shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold"
                style={{ borderColor: C.ink }}
              >
                Opsyon
              </Link>
            ) : (
              <button
                aria-label={`Ajoute ${p.name} nan panye`}
                onClick={() => {
                  if (addToCart(p, 1)) setCartOpen(true);
                }}
                className="shrink-0 w-9 h-9 rounded-full text-white flex items-center justify-center"
                style={{ background: C.ink }}
              >
                <ShoppingCart size={16} />
              </button>
            ))}
        </div>
        {!compact && p.unit && (
          <p className="text-[11px] mt-0.5" style={{ color: C.muted }}>
            pou chak {p.unit.toLowerCase()}
          </p>
        )}
      </div>
    </article>
  );
}

/** Ranje orizontal (kawousèl) tankou Amazon/Shein */
export function ProductRow({ title, products, href }: { title: string; products: PublicProduct[]; href?: string }) {
  if (products.length === 0) return null;
  return (
    <section className="mb-10">
      <div className="flex items-end justify-between mb-3">
        <h2 className="text-xl font-bold">{title}</h2>
        {href && (
          <Link href={href} className="text-sm font-semibold underline underline-offset-2" style={{ color: C.red }}>
            Wè tout
          </Link>
        )}
      </div>
      <div className="flex gap-3 sm:gap-4 overflow-x-auto snap-x pb-2 -mx-4 px-4 [scrollbar-width:none]">
        {products.map((p) => (
          <div key={p.id} className="snap-start shrink-0 w-[10.5rem] sm:w-52">
            <ProductCard p={p} compact />
          </div>
        ))}
      </div>
    </section>
  );
}
