"use client";

import { memo, useMemo, useState } from "react";
import { useLanguage } from "@/lib/i18n/language-provider";

interface Day {
  date: string; // YYYY-MM-DD
  revenue: number;
  profit: number;
}

const W = 320;
const H = 150;
const TOP = 8;
const BOTTOM = 26;

function fmt(n: number) {
  return `${Math.round(n).toLocaleString("fr-FR")} G`;
}

function weekday(date: string) {
  const d = new Date(`${date}T12:00:00Z`);
  return d.toLocaleDateString("fr-FR", { weekday: "short", timeZone: "UTC" }).replace(".", "");
}

/** Grafik pwofi 7 jou: SVG pi, pa gen bibliyotèk → ti bundle, defilman fliid sou telefòn. */
function WeeklyProfitChartBase({ data }: { data: Day[] }) {
  const { t } = useLanguage();
  const [picked, setPicked] = useState<number | null>(null);
  const sel = picked ?? data.length - 1;

  const geo = useMemo(() => {
    const max = Math.max(1, ...data.map((d) => Math.max(d.revenue, d.profit, 0)));
    const min = Math.min(0, ...data.map((d) => d.profit));
    const plotH = H - TOP - BOTTOM;
    const y = (v: number) => TOP + ((max - v) / (max - min)) * plotH;
    const slot = W / data.length;
    return { y, y0: y(0), slot, bw: Math.min(34, slot * 0.62) };
  }, [data]);

  const total = data.reduce((s, d) => s + d.profit, 0);
  const cur = data[sel];
  const { y, y0, slot, bw } = geo;

  return (
    <div className="rounded-card border border-line dark:border-dark-border bg-white dark:bg-dark-surface shadow-card dark:shadow-none p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-ink/55 dark:text-white/55">{t("dash_weekly_profit")}</p>
          <p className={`stat-figure mt-1 text-2xl font-extrabold leading-none ${total < 0 ? "text-brick" : ""}`}>{fmt(total)}</p>
        </div>
        {cur && (
          <div className="text-right shrink-0">
            <p className="text-[11px] font-medium text-ink/50 dark:text-white/50 capitalize">
              {weekday(cur.date)} {cur.date.slice(8, 10)}/{cur.date.slice(5, 7)}
            </p>
            <p className="stat-figure text-sm font-bold">{fmt(cur.profit)}</p>
            <p className="text-[11px] text-ink/50 dark:text-white/50">
              {t("dash_weekly_revenue")}: {fmt(cur.revenue)}
            </p>
          </div>
        )}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto mt-3 text-ink dark:text-white select-none" role="img" aria-label={t("dash_weekly_profit")}>
        <line x1="0" x2={W} y1={y0} y2={y0} stroke="currentColor" strokeOpacity="0.15" strokeWidth="1" />
        {data.map((d, i) => {
          const cx = slot * i + slot / 2;
          const active = i === sel;
          const revTop = y(Math.max(d.revenue, 0));
          const pw = bw * 0.6;
          const pTop = d.profit >= 0 ? y(d.profit) : y0;
          const pH = Math.max(Math.abs(y(d.profit) - y0), d.profit === 0 ? 0 : 2);
          return (
            <g key={d.date} onClick={() => setPicked(i)} style={{ cursor: "pointer" }}>
              <rect x={slot * i} y={0} width={slot} height={H} fill="transparent" />
              {/* Vant (dèyè, sibtil) */}
              <rect x={cx - bw / 2} y={revTop} width={bw} height={Math.max(y0 - revTop, 0)} rx="6" fill="currentColor" fillOpacity={active ? 0.16 : 0.08} />
              {/* Pwofi (devan) */}
              <rect
                x={cx - pw / 2}
                y={pTop}
                width={pw}
                height={pH}
                rx="4"
                fill={d.profit >= 0 ? "#C8102E" : "currentColor"}
                fillOpacity={active ? 1 : 0.6}
              />
              <text x={cx} y={H - 8} textAnchor="middle" fontSize="10" fill="currentColor" fillOpacity={active ? 0.9 : 0.5} fontWeight={active ? 700 : 500} style={{ textTransform: "capitalize" }}>
                {weekday(d.date)}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="mt-1 flex items-center gap-4 text-[11px] text-ink/55 dark:text-white/55">
        <span className="inline-flex items-center gap-1.5"><span aria-hidden className="w-2.5 h-2.5 rounded-sm bg-brick" />{t("dash_weekly_profit_short")}</span>
        <span className="inline-flex items-center gap-1.5"><span aria-hidden className="w-2.5 h-2.5 rounded-sm bg-ink/15 dark:bg-white/20" />{t("dash_weekly_revenue")}</span>
      </div>
    </div>
  );
}

export const WeeklyProfitChart = memo(WeeklyProfitChartBase);
