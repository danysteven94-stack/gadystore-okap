"use client";

import { useT } from "./shop-context";
import { useEffect, useRef, useState } from "react";
import { ShoppingBag, Star, X } from "lucide-react";
import type { PublicProduct } from "@/lib/shop";

// Palèt: blan, nwa ak rouj
export const C = {
  ink: "#111111",
  soft: "#F5F5F5",
  red: "var(--shop-accent, #C8102E)", // koulè prensipal: chanje nan paramèt boutik la
  redDark: "var(--shop-accent-dark, #9E0C24)",
  line: "#E5E5E5",
  muted: "#6B6B6B",
  ok: "#15803D",
  star: "#F59E0B",
} as const;

export const clamp2 = {
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
} as const;

export function discountPct(p: Pick<PublicProduct, "price" | "comparePrice">) {
  return p.comparePrice && p.comparePrice > p.price ? Math.round((1 - p.price / p.comparePrice) * 100) : 0;
}

export function isNew(p: Pick<PublicProduct, "createdAt">) {
  if (!p.createdAt) return false;
  const t = new Date(p.createdAt).getTime();
  return Number.isFinite(t) && Date.now() - t < 14 * 86400000;
}

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  const t = useT();
  return (
    <span className="inline-flex items-center" aria-label={t("{n} sou 5", { n: value })}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - (i - 1)));
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <Star size={size} color={C.star} className="absolute inset-0" />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star size={size} color={C.star} fill={C.star} />
            </span>
          </span>
        );
      })}
    </span>
  );
}

export function Price({
  p,
  money,
  big,
}: {
  p: Pick<PublicProduct, "price" | "comparePrice">;
  money: (n: number) => string;
  big?: boolean;
}) {
  const pct = discountPct(p);
  return (
    <span className="inline-flex items-baseline flex-wrap gap-x-2">
      <span className={`font-bold tabular-nums ${big ? "text-3xl" : "text-[17px]"}`} style={{ color: pct ? C.red : C.ink }}>
        {money(p.price)}
      </span>
      {pct > 0 && p.comparePrice && (
        <span className={`line-through tabular-nums ${big ? "text-base" : "text-xs"}`} style={{ color: C.muted }}>
          {money(p.comparePrice)}
        </span>
      )}
    </span>
  );
}

export function StockLine({ p }: { p: PublicProduct }) {
  const t = useT();
  if (p.comingSoon) {
    return <p className="text-xs font-semibold" style={{ color: "#B45309" }}>{t("Byento disponib")}</p>;
  }
  if (p.digital) {
    return (
      <p className="flex items-center gap-1.5 text-xs font-medium" style={{ color: C.ok }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: C.ok }} />
        {t("Disponib")}
      </p>
    );
  }
  const out = p.stock <= 0;
  if (p.dish && out) return <p className="text-xs font-semibold" style={{ color: C.red }}>{t("Fini pou jodi a")}</p>;
  const low = !out && p.stock <= 5;
  const color = out ? C.red : low ? "#B45309" : C.ok;
  const text = out
    ? t("Fini pou kounye a")
    : low
    ? t("Sèlman {n} rete", { n: `${p.stock}${p.unit ? " " + p.unit : ""}` })
    : t("{n} disponib", { n: `${p.stock.toLocaleString("fr-FR")}${p.unit ? " " + p.unit : ""}` });
  return (
    <p className="flex items-center gap-1.5 text-xs font-medium" style={{ color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {text}
    </p>
  );
}

export function Sheet({
  children,
  onClose,
  flush,
  side,
}: {
  children: React.ReactNode;
  onClose: () => void;
  flush?: boolean;
  side?: "right";
}) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  if (side === "right") {
    return (
      <div className="fixed inset-0 z-[60] flex justify-end bg-black/55" onClick={onClose}>
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md h-full bg-white flex flex-col"
          style={{ animation: "slideIn .22s ease-out both" }}
        >
          {children}
        </div>
      </div>
    );
  }
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/55" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto bg-white ${
          flush ? "" : "p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

export function SheetHeader({ title, onClose }: { title: string; onClose: () => void }) {
  const t = useT();
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-xl font-semibold pr-6">{title}</h3>
      <button onClick={onClose} aria-label={t("Fèmen")} className="p-1">
        <X size={22} />
      </button>
    </div>
  );
}

export const fieldClass =
  "w-full rounded-xl border bg-white text-[#111111] placeholder:text-[#6B6B6B] dark:bg-white dark:text-[#111111] px-4 py-3.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-black/20";
export const fieldStyle = { borderColor: C.line } as const;

/** Etap livrezon yo, nan lòd. */
export const FULFILLMENT_STEPS = [
  { id: "new", label: "Kòmand resevwa" },
  { id: "confirmed", label: "Konfime" },
  { id: "preparing", label: "Ap prepare" },
  { id: "shipped", label: "Nan wout", labelPickup: "Pare pou ranmase" },
  { id: "delivered", label: "Livre", labelPickup: "Ranmase||status" },
] as const;

/**
 * Foto manje: pa gen fon gri ki parèt, pa gen rekòp brital.
 *  - Anvan foto a chaje: yon fon cho ak yon "shimmer" dous.
 *  - Lè l chaje: fondi (fade-in) — pa gen flash.
 *  - mode "cover"  → foto a ranpli tout kare a (kat, ti vinyèt).
 *  - mode "contain" → foto a parèt antye sou yon fon flou ki pran koulè foto a menm
 *    (pa gen bann blan/nwa, kèlkeswa fòma foto a: vètikal, orizontal, kare).
 */
export function FoodImage({
  src,
  alt = "",
  mode = "cover",
  className = "",
  imgClassName = "",
  eager,
  dim,
  onClick,
}: {
  src: string | null | undefined;
  alt?: string;
  mode?: "cover" | "contain";
  className?: string;
  imgClassName?: string;
  eager?: boolean;
  dim?: boolean; // grise (plat fini)
  onClick?: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
    const el = ref.current;
    if (el && el.complete && el.naturalWidth > 0) setLoaded(true);
  }, [src]);

  const fade = `transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`;

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: "linear-gradient(135deg,#F4F1EC,#EAE5DE)" }}
      onClick={onClick}
    >
      {!loaded && !failed && <span className="absolute inset-0 food-shimmer" aria-hidden />}
      {src && !failed ? (
        <>
          {mode === "contain" && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt=""
              aria-hidden
              decoding="async"
              className={`absolute inset-0 w-full h-full object-cover scale-125 blur-2xl saturate-150 ${fade} ${dim ? "grayscale" : ""}`}
              style={{ opacity: loaded ? 0.9 : 0 }}
            />
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={ref}
            src={src}
            alt={alt}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            className={`relative w-full h-full ${mode === "contain" ? "object-contain" : "object-cover"} ${fade} ${dim ? "grayscale opacity-60" : ""} ${imgClassName}`}
          />
        </>
      ) : (
        <span className="absolute inset-0 flex items-center justify-center" style={{ color: "#CFC8BD" }}>
          <ShoppingBag size={32} />
        </span>
      )}
    </div>
  );
}
