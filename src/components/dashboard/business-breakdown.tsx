"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/language-provider";

interface Props {
  businesses: { id: string; name: string; revenue: number }[];
  /** Tit sou total la (ex: "Revni mwa a"). Pa defo: "Revni". */
  label?: string;
}

function fmt(n: number) {
  return `${n.toLocaleString("fr-FR")} G`;
}

// Palèt mak la (wouj, nwa, gri) — chak antrepriz gen pwòp koulè li, vizib nan mòd klè kou sonb.
const COLORS = [
  "bg-brick",
  "bg-ink dark:bg-white",
  "bg-brick/55",
  "bg-ink/55 dark:bg-white/55",
  "bg-brick/30",
  "bg-ink/30 dark:bg-white/30",
];

export function BusinessBreakdown({ businesses, label }: Props) {
  const { t } = useLanguage();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const rows = [...businesses].sort((a, b) => b.revenue - a.revenue);
  const total = rows.reduce((sum, b) => sum + b.revenue, 0);

  return (
    <div className="rounded-card border border-line dark:border-dark-border bg-white dark:bg-dark-surface shadow-card dark:shadow-none p-4 sm:p-5">
      <div className="flex items-end justify-between gap-3 mb-4">
        <div>
          <p className="text-xs font-medium text-ink/55 dark:text-white/55">{label ?? t("dash_group_revenue")}</p>
          <p className="stat-figure mt-1 text-2xl font-extrabold leading-none">{fmt(total)}</p>
        </div>
        <span className="text-[11px] font-medium text-ink/50 dark:text-white/50 bg-mist dark:bg-white/10 rounded-full px-2.5 py-1">
          {rows.length}
        </span>
      </div>

      {/* Bann pwopòsyon: tout antrepriz yo nan yon sèl gade */}
      <div className="flex h-3 w-full gap-[3px] rounded-full overflow-hidden bg-mist dark:bg-white/10" role="img" aria-label="Repartisyon revni">
        {total > 0 &&
          rows.map((b, i) =>
            b.revenue > 0 ? (
              <div
                key={b.id}
                className={`h-full first:rounded-l-full last:rounded-r-full transition-[flex-grow] duration-700 ease-out ${COLORS[i % COLORS.length]}`}
                style={{ flexGrow: ready ? b.revenue : 0, flexBasis: 0, minWidth: ready ? 6 : 0 }}
              />
            ) : null
          )}
      </div>

      <ul className="mt-4 divide-y divide-line dark:divide-dark-border/60">
        {rows.map((b, i) => {
          const pct = total > 0 ? (b.revenue / total) * 100 : 0;
          return (
            <li key={b.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
              <span aria-hidden className={`w-2.5 h-2.5 rounded-full shrink-0 ${COLORS[i % COLORS.length]}`} />
              <span className="flex-1 min-w-0 truncate text-sm font-medium">{b.name}</span>
              <span className="text-xs tabular-nums text-ink/50 dark:text-white/50 w-10 text-right">
                {pct > 0 && pct < 1 ? "<1" : Math.round(pct)}%
              </span>
              <span className="stat-figure text-sm font-bold whitespace-nowrap w-28 text-right">{fmt(b.revenue)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
