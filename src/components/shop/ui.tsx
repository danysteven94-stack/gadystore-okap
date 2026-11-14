"use client";

import { useT } from "./shop-context";
import { useEffect } from "react";
import { Star, X } from "lucide-react";
import type { PublicProduct } from "@/lib/shop";

// Palèt: blan, nwa ak rouj
export const C = {
  ink: "#111111",
  soft: "#F5F5F5",
  red: "#C8102E",
  redDark: "#9E0C24",
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
  if (p.digital) {
    return (
      <p className="flex items-center gap-1.5 text-xs font-medium" style={{ color: C.ok }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: C.ok }} />
        {t("Pwodwi online · disponib")}
      </p>
    );
  }
  const out = p.stock <= 0;
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
  "w-full rounded-xl border bg-white px-4 py-3.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-black/20";
export const fieldStyle = { borderColor: C.line } as const;

/** Etap livrezon yo, nan lòd. */
export const FULFILLMENT_STEPS = [
  { id: "new", label: "Kòmand resevwa" },
  { id: "confirmed", label: "Konfime" },
  { id: "preparing", label: "Ap prepare" },
  { id: "shipped", label: "Nan wout", labelPickup: "Pare pou ranmase" },
  { id: "delivered", label: "Livre", labelPickup: "Ranmase||status" },
] as const;
