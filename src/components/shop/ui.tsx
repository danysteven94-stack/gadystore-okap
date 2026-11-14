"use client";

import { useEffect } from "react";
import { Star, X } from "lucide-react";

// Palèt: blan, nwa ak rouj (menm jan ak rès aplikasyon an)
export const C = {
  ink: "#111111",
  red: "#C8102E",
  redDark: "#9E0C24",
  soft: "#F5F5F5",
  line: "#E5E5E5",
  muted: "#6B6B6B",
  star: "#F59E0B",
  ok: "#0F7B3F",
};

export const clamp2: React.CSSProperties = {
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  const row = (color: string, fill: boolean) => (
    <span className="flex">
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} size={size} color={color} fill={fill ? color : "none"} strokeWidth={1.5} />
      ))}
    </span>
  );
  return (
    <span className="relative inline-flex" role="img" aria-label={`${value} sou 5`}>
      {row("#D4D4D4", false)}
      <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${pct}%` }}>
        {row(C.star, true)}
      </span>
    </span>
  );
}

export function StarInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Nòt">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} etwal`}
          onClick={() => onChange(n)}
          className="p-0.5"
        >
          <Star size={28} color={n <= value ? C.star : "#D4D4D4"} fill={n <= value ? C.star : "none"} strokeWidth={1.5} />
        </button>
      ))}
    </div>
  );
}

/** Fenèt modal (bottom sheet sou telefòn) */
export function Sheet({
  children,
  onClose,
  title,
  side,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title?: string;
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

  const panel =
    side === "right"
      ? "ml-auto h-full w-full max-w-md"
      : "w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl max-h-[92vh] sm:my-auto";
  return (
    <div
      className={`fixed inset-0 z-[60] bg-black/55 flex ${side === "right" ? "" : "items-end sm:items-center justify-center"}`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div onClick={(e) => e.stopPropagation()} className={`bg-white flex flex-col overflow-hidden ${panel}`}>
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: C.line }}>
            <h2 className="text-lg font-bold">{title}</h2>
            <button onClick={onClose} aria-label="Fèmen" className="p-1">
              <X size={22} />
            </button>
          </div>
        )}
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

export function PriceBlock({
  price,
  oldPrice,
  money,
  big,
}: {
  price: number;
  oldPrice: number | null;
  money: (n: number) => string;
  big?: boolean;
}) {
  return (
    <span className="flex items-baseline flex-wrap gap-x-2">
      <span className={`${big ? "text-3xl" : "text-lg"} font-bold tabular-nums`} style={{ color: oldPrice ? C.red : C.ink }}>
        {money(price)}
      </span>
      {oldPrice && (
        <span className={`${big ? "text-base" : "text-xs"} line-through tabular-nums`} style={{ color: C.muted }}>
          {money(oldPrice)}
        </span>
      )}
    </span>
  );
}

export const field =
  "w-full rounded-lg border bg-white px-3.5 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black";
