"use client";

import { useEffect, useState, useCallback } from "react";
import { Boxes, Loader2, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { BusinessSwitcher } from "@/components/dashboard/business-switcher";
import type { Business, Product } from "@/types";

interface StockReport {
  available: Product[];
  low: Product[];
  outOfStock: Product[];
  totalStockValue: number;
  summary: { totalProducts: number; availableCount: number; lowCount: number; outOfStockCount: number };
}

function fmt(n: number) {
  return `${n.toLocaleString("fr-FR")} G`;
}

const TABS = [
  { key: "low", label: "Stok Fèb", icon: AlertTriangle, color: "text-gold-dark" },
  { key: "outOfStock", label: "Rupti", icon: XCircle, color: "text-brick" },
  { key: "available", label: "Anfòm", icon: CheckCircle2, color: "text-emerald-600" },
] as const;

export default function StockPage() {
  const [businesses, setBusinesses] = useState<Business[] | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [report, setReport] = useState<StockReport | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("low");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/businesses")
      .then((res) => res.json())
      .then((data) => {
        setBusinesses(data.businesses ?? []);
        if (data.businesses?.length) setBusinessId(data.businesses[0].id);
      })
      .catch(() => setBusinesses([]));
  }, []);

  const load = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/stock?businessId=${businessId}`);
      const data = await res.json();
      setReport(data);
    } catch {
      setReport(null);
    }
    setLoading(false);
  }, [businessId]);

  useEffect(() => {
    load();
  }, [load]);

  if (businesses === null) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 flex flex-col items-center text-ink/40 dark:text-paper/40">
        <Loader2 size={24} className="animate-spin mb-2" />
        <p className="text-sm">Ap chaje...</p>
      </main>
    );
  }

  if (businesses.length === 0) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 text-center">
        <Boxes size={28} className="mx-auto mb-3 text-ink/30" />
        <p className="text-sm text-ink/60 dark:text-paper/60">
          Kreye yon antrepriz anvan pou wè rapò stok.
        </p>
      </main>
    );
  }

  const list = report ? report[tab] : [];

  return (
    <main className="max-w-3xl mx-auto px-4 lg:px-8 py-8 pb-24">
      <h1 className="font-display text-xl lg:text-2xl mb-4">Rapò Stok</h1>

      <BusinessSwitcher
        businesses={businesses.map((b) => ({ id: b.id, name: b.name, icon: b.icon }))}
        activeId={businessId ?? ""}
        onSelect={setBusinessId}
        showOverviewTab={false}
      />

      {loading || !report ? (
        <div className="flex justify-center py-16 text-ink/40 dark:text-paper/40">
          <Loader2 size={24} className="animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 my-5">
            <div className="rounded-card border border-ink/10 dark:border-dark-border bg-white dark:bg-dark-surface p-3">
              <p className="text-xs text-ink/50 dark:text-paper/50 mb-1">Total pwodwi</p>
              <p className="stat-figure text-lg font-medium">{report.summary.totalProducts}</p>
            </div>
            <div className="rounded-card border border-ink/10 dark:border-dark-border bg-white dark:bg-dark-surface p-3">
              <p className="text-xs text-ink/50 dark:text-paper/50 mb-1">Stok fèb</p>
              <p className="stat-figure text-lg font-medium text-gold-dark">{report.summary.lowCount}</p>
            </div>
            <div className="rounded-card border border-ink/10 dark:border-dark-border bg-white dark:bg-dark-surface p-3">
              <p className="text-xs text-ink/50 dark:text-paper/50 mb-1">Rupti</p>
              <p className="stat-figure text-lg font-medium text-brick">{report.summary.outOfStockCount}</p>
            </div>
            <div className="rounded-card border border-ink/10 dark:border-dark-border bg-white dark:bg-dark-surface p-3">
              <p className="text-xs text-ink/50 dark:text-paper/50 mb-1">Valè total</p>
              <p className="stat-figure text-lg font-medium">{fmt(report.totalStockValue)}</p>
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            {TABS.map(({ key, label, icon: Icon, color }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-xs font-medium border ${
                  tab === key
                    ? "bg-ink text-paper border-ink"
                    : "border-ink/15 dark:border-dark-border text-ink/70 dark:text-paper/70"
                }`}
              >
                <Icon size={13} className={tab === key ? "" : color} />
                {label}
              </button>
            ))}
          </div>

          {list.length === 0 ? (
            <p className="text-sm text-center text-ink/40 dark:text-paper/40 py-10">
              Pa gen pwodwi nan kategori sa a.
            </p>
          ) : (
            <div className="rounded-card border border-ink/10 dark:border-dark-border bg-white dark:bg-dark-surface overflow-hidden">
              {list.map((p, i) => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between px-4 py-3 text-sm ${
                    i > 0 ? "border-t border-ink/8 dark:border-dark-border/60" : ""
                  }`}
                >
                  <span>
                    {p.name}
                    <span className="block text-xs text-ink/40 dark:text-paper/40">{p.category}</span>
                  </span>
                  <span className="stat-figure text-ink/60 dark:text-paper/60">
                    {p.stock} / min {p.minStock}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}
