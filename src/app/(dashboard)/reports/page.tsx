"use client";

import { useEffect, useState, useCallback } from "react";
import { BarChart3, Loader2, Download, Trophy } from "lucide-react";
import { BusinessSwitcher } from "@/components/dashboard/business-switcher";
import type { Business } from "@/types";

interface FinancialRow {
  date: string;
  revenue: number;
  expenses: number;
  profit: number;
}

interface SalesReport {
  totalSales: number;
  totalRevenue: number;
  topProducts: { name: string; qty: number; revenue: number }[];
  byPaymentMethod: Record<string, number>;
}

function fmt(n: number) {
  return `${n.toLocaleString("fr-FR")} G`;
}

function isoDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export default function ReportsPage() {
  const [businesses, setBusinesses] = useState<Business[] | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [from, setFrom] = useState(isoDaysAgo(6));
  const [to, setTo] = useState(isoDaysAgo(0));
  const [financial, setFinancial] = useState<{ rows: FinancialRow[]; totals: FinancialRow } | null>(null);
  const [sales, setSales] = useState<SalesReport | null>(null);
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
      const [finRes, salesRes] = await Promise.all([
        fetch(`/api/reports/financial?businessId=${businessId}&from=${from}&to=${to}`).then((r) => r.json()),
        fetch(`/api/reports/sales?businessId=${businessId}&from=${from}&to=${to}`).then((r) => r.json()),
      ]);
      setFinancial(finRes);
      setSales(salesRes);
    } catch {
      setFinancial(null);
      setSales(null);
    }
    setLoading(false);
  }, [businessId, from, to]);

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
        <BarChart3 size={28} className="mx-auto mb-3 text-ink/30" />
        <p className="text-sm text-ink/60 dark:text-paper/60">
          Kreye yon antrepriz anvan pou wè rapò.
        </p>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 lg:px-8 py-8 pb-24">
      <h1 className="font-display text-xl lg:text-2xl mb-4">Rapò</h1>

      <BusinessSwitcher
        businesses={businesses.map((b) => ({ id: b.id, name: b.name, icon: b.icon }))}
        activeId={businessId ?? ""}
        onSelect={setBusinessId}
        showOverviewTab={false}
      />

      <div className="flex items-end gap-3 my-5">
        <label className="block flex-1">
          <span className="block text-xs font-medium text-ink/70 dark:text-paper/70 mb-1">Depi</span>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full border border-ink/15 dark:border-dark-border bg-white dark:bg-dark-surface rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30"
          />
        </label>
        <label className="block flex-1">
          <span className="block text-xs font-medium text-ink/70 dark:text-paper/70 mb-1">Jiska</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full border border-ink/15 dark:border-dark-border bg-white dark:bg-dark-surface rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30"
          />
        </label>
        {businessId && (
          <a
            href={`/api/reports/financial?businessId=${businessId}&from=${from}&to=${to}&format=excel`}
            className="flex items-center gap-1.5 bg-ink text-paper rounded-full px-4 py-2.5 text-xs font-medium shrink-0"
          >
            <Download size={14} /> Excel
          </a>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-ink/40 dark:text-paper/40">
          <Loader2 size={24} className="animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="rounded-card border border-ink/10 dark:border-dark-border bg-white dark:bg-dark-surface p-3">
              <p className="text-xs text-ink/50 dark:text-paper/50 mb-1">Revni</p>
              <p className="stat-figure text-base font-medium">
                {fmt(financial?.totals.revenue ?? 0)}
              </p>
            </div>
            <div className="rounded-card border border-ink/10 dark:border-dark-border bg-white dark:bg-dark-surface p-3">
              <p className="text-xs text-ink/50 dark:text-paper/50 mb-1">Depans</p>
              <p className="stat-figure text-base font-medium">
                {fmt(financial?.totals.expenses ?? 0)}
              </p>
            </div>
            <div className="rounded-card border border-ink/10 dark:border-dark-border bg-forest/10 dark:bg-forest/20 p-3">
              <p className="text-xs text-forest mb-1">Pwofi</p>
              <p className="stat-figure text-base font-medium text-forest">
                {fmt(financial?.totals.profit ?? 0)}
              </p>
            </div>
          </div>

          <h2 className="font-display text-base mb-2 flex items-center gap-2">
            <Trophy size={16} className="text-gold-dark" /> Pi bon pwodwi
          </h2>
          <div className="rounded-card border border-ink/10 dark:border-dark-border bg-white dark:bg-dark-surface overflow-hidden mb-6">
            {!sales || sales.topProducts.length === 0 ? (
              <p className="text-sm text-center text-ink/40 dark:text-paper/40 py-8">
                Pa gen vant nan peryòd sa a.
              </p>
            ) : (
              sales.topProducts.slice(0, 8).map((p, i) => (
                <div
                  key={p.name}
                  className={`flex items-center justify-between px-4 py-3 text-sm ${
                    i > 0 ? "border-t border-ink/8 dark:border-dark-border/60" : ""
                  }`}
                >
                  <span>
                    {i + 1}. {p.name}
                  </span>
                  <span className="text-right">
                    <span className="stat-figure block font-medium">{fmt(p.revenue)}</span>
                    <span className="block text-xs text-ink/40 dark:text-paper/40">{p.qty} vandi</span>
                  </span>
                </div>
              ))
            )}
          </div>

          <h2 className="font-display text-base mb-2">Repartisyon pa mòd peman</h2>
          <div className="rounded-card border border-ink/10 dark:border-dark-border bg-white dark:bg-dark-surface overflow-hidden">
            {!sales || Object.keys(sales.byPaymentMethod).length === 0 ? (
              <p className="text-sm text-center text-ink/40 dark:text-paper/40 py-8">
                Pa gen done.
              </p>
            ) : (
              Object.entries(sales.byPaymentMethod).map(([method, amount], i) => (
                <div
                  key={method}
                  className={`flex items-center justify-between px-4 py-3 text-sm ${
                    i > 0 ? "border-t border-ink/8 dark:border-dark-border/60" : ""
                  }`}
                >
                  <span className="capitalize">{method.replace("_", " ")}</span>
                  <span className="stat-figure font-medium">{fmt(amount)}</span>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </main>
  );
}
