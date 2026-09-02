"use client";

import { useEffect, useState, useCallback } from "react";
import { AlertTriangle, Trophy, Plus, Loader2, ShoppingCart, Package, Undo2 } from "lucide-react";
import { BusinessSwitcher } from "@/components/dashboard/business-switcher";
import { StatCard } from "@/components/dashboard/stat-card";
import { BusinessBreakdown } from "@/components/dashboard/business-breakdown";
import { BusinessForm, type BusinessFormValues } from "@/components/business/business-form";
import type { Business, DashboardStats } from "@/types";

function fmt(n: number) {
  return `${n.toLocaleString("fr-FR")} G`;
}

export default function DashboardPage() {
  const [businesses, setBusinesses] = useState<Business[] | null>(null);
  const [activeId, setActiveId] = useState("all");
  const [statsByBusiness, setStatsByBusiness] = useState<Record<string, DashboardStats>>({});
  const [loadingStats, setLoadingStats] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBusinesses = useCallback(async () => {
    try {
      const res = await fetch("/api/businesses");
      if (!res.ok) throw new Error(`Erè ${res.status}`);
      const data = await res.json();
      setBusinesses(data.businesses ?? []);
    } catch {
      setError("Pa ka chaje antrepriz yo. Verifye koneksyon ou.");
      setBusinesses([]);
    }
  }, []);

  useEffect(() => {
    loadBusinesses();
  }, [loadBusinesses]);

  useEffect(() => {
    if (!businesses || businesses.length === 0) return;

    let cancelled = false;
    setLoadingStats(true);

    (async () => {
      const entries = await Promise.all(
        businesses.map(async (b) => {
          try {
            const res = await fetch(`/api/dashboard?businessId=${b.id}`);
            const data = await res.json();
            return [b.id, data as DashboardStats] as const;
          } catch {
            return [
              b.id,
              {
                todayRevenue: 0,
                todaySales: 0,
                todayExpenses: 0,
                todayProfit: 0,
                monthRevenue: 0,
                monthSales: 0,
                monthExpenses: 0,
                monthProfit: 0,
                outOfStockCount: 0,
                stockValue: 0,
                lowStock: [],
                recentSales: [],
              } as DashboardStats,
            ] as const;
          }
        })
      );
      if (!cancelled) {
        setStatsByBusiness(Object.fromEntries(entries));
        setLoadingStats(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [businesses]);

  async function handleCreateBusiness(values: BusinessFormValues) {
    setSavingBusiness(true);
    setError(null);
    try {
      const res = await fetch("/api/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Pa ka kreye antrepriz la.");
        setSavingBusiness(false);
        return;
      }
      setShowForm(false);
      setSavingBusiness(false);
      await loadBusinesses();
      setActiveId(data.business.id);
    } catch {
      setError("Erè rezo — eseye ankò.");
      setSavingBusiness(false);
    }
  }

  // Chajman inisyal
  if (businesses === null) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 flex flex-col items-center text-ink/40 dark:text-paper/40">
        <Loader2 size={24} className="animate-spin mb-2" />
        <p className="text-sm">Ap chaje antrepriz ou yo...</p>
      </main>
    );
  }

  // Okenn antrepriz — envite kreye premye a
  if (businesses.length === 0) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="font-display text-xl mb-2">Byenveni!</p>
        <p className="text-sm text-ink/60 dark:text-paper/60 mb-6">
          Ou poko gen okenn antrepriz. Kreye premye a pou kòmanse jere ventyoup, stok ak faktè ou.
        </p>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 bg-ink text-paper rounded-full px-5 py-2.5 text-sm font-medium"
        >
          <Plus size={16} /> Ajoute premye antrepriz
        </button>
        {error && <p className="text-sm text-brick mt-4">{error}</p>}
        {showForm && (
          <BusinessForm
            onSave={handleCreateBusiness}
            onClose={() => setShowForm(false)}
            saving={savingBusiness}
          />
        )}
      </main>
    );
  }

  const empireRevenue = Object.values(statsByBusiness).reduce(
    (s, b) => s + (b?.todayRevenue ?? 0),
    0
  );
  const empireProfit = Object.values(statsByBusiness).reduce(
    (s, b) => s + (b?.todayProfit ?? 0),
    0
  );

  const switcherBusinesses = businesses.map((b) => ({ id: b.id, name: b.name, icon: b.icon }));

  if (activeId === "all") {
    return (
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-3">
          <BusinessSwitcher
            businesses={switcherBusinesses}
            activeId={activeId}
            onSelect={setActiveId}
          />
          <button
            onClick={() => setShowForm(true)}
            aria-label="Ajoute yon antrepriz"
            className="w-9 h-9 shrink-0 rounded-full border border-ink/15 dark:border-dark-border flex items-center justify-center ml-2"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="mt-6 mb-6 rounded-card p-5 bg-gradient-to-br from-forest to-forest-light text-paper">
          <p className="text-xs uppercase tracking-wide text-gold-light mb-2">
            Tout Antrepriz — Jodi a
          </p>
          <p className="font-display text-2xl mb-3">
            {loadingStats ? "..." : fmt(empireRevenue)}
          </p>
          <p className="text-sm">
            Pwofi net:{" "}
            <span className="stat-figure font-medium">
              {loadingStats ? "..." : fmt(empireProfit)}
            </span>{" "}
            <span className="opacity-60">
              · {businesses.length} antrepriz aktif
            </span>
          </p>
        </div>

        <h2 className="font-display text-base mb-2">Repartisyon pa antrepriz</h2>
        <BusinessBreakdown
          businesses={businesses.map((b) => ({
            id: b.id,
            name: b.name,
            revenue: statsByBusiness[b.id]?.todayRevenue ?? 0,
          }))}
        />

        {showForm && (
          <BusinessForm
            onSave={handleCreateBusiness}
            onClose={() => setShowForm(false)}
            saving={savingBusiness}
          />
        )}
      </main>
    );
  }

  const activeBusiness = businesses.find((b) => b.id === activeId);
  const stats = statsByBusiness[activeId];

  if (!activeBusiness) {
    setActiveId("all");
    return null;
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-3">
        <BusinessSwitcher
          businesses={switcherBusinesses}
          activeId={activeId}
          onSelect={setActiveId}
        />
        <button
          onClick={() => setShowForm(true)}
          aria-label="Ajoute yon antrepriz"
          className="w-9 h-9 shrink-0 rounded-full border border-ink/15 dark:border-dark-border flex items-center justify-center ml-2"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="flex items-baseline justify-between mt-6 mb-4">
        <h1 className="font-display text-xl">{activeBusiness.name}</h1>
        <p className="text-xs text-ink/50 dark:text-paper/50">
          {new Date().toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>

      {!stats ? (
        <div className="flex justify-center py-10 text-ink/40 dark:text-paper/40">
          <Loader2 size={20} className="animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            <StatCard label="Revni jodi a" value={fmt(stats.todayRevenue)} />
            <StatCard label="Revni mwa a" value={fmt(stats.monthRevenue)} />
            <StatCard label="Vant (mwa)" value={String(stats.monthSales)} />
            <StatCard label="Depans (mwa)" value={fmt(stats.monthExpenses)} />
            <StatCard label="Pwofi net (mwa)" value={fmt(stats.monthProfit)} accent />
            <StatCard label="Pwodwi an rupti" value={String(stats.outOfStockCount)} />
            <StatCard label="Stok fèb" value={String(stats.lowStock.length)} />
            <StatCard label="Valè stok" value={fmt(stats.stockValue)} />
          </div>

          <section className="mb-8">
            <p className="text-[11px] uppercase tracking-wide text-ink/40 dark:text-paper/40 mb-2">
              Aksè rapid
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <a
                href="/pos"
                className="flex items-center gap-3 rounded-card border border-ink/10 dark:border-dark-border bg-white dark:bg-dark-surface p-4 hover:border-forest/40 transition-colors"
              >
                <span className="w-10 h-10 rounded-xl bg-brick/10 text-brick flex items-center justify-center shrink-0">
                  <ShoppingCart size={18} />
                </span>
                <span>
                  <span className="block text-sm font-medium">Ouvri kès la</span>
                  <span className="block text-xs text-ink/50 dark:text-paper/50">
                    Nouvo vant an kèk segonn
                  </span>
                </span>
              </a>
              <a
                href="/products"
                className="flex items-center gap-3 rounded-card border border-ink/10 dark:border-dark-border bg-white dark:bg-dark-surface p-4 hover:border-forest/40 transition-colors"
              >
                <span className="w-10 h-10 rounded-xl bg-forest/10 text-forest flex items-center justify-center shrink-0">
                  <Package size={18} />
                </span>
                <span>
                  <span className="block text-sm font-medium">Jere pwodwi</span>
                  <span className="block text-xs text-ink/50 dark:text-paper/50">
                    Ajoute, modifye, swiv stok
                  </span>
                </span>
              </a>
              <a
                href="/returns"
                className="flex items-center gap-3 rounded-card border border-ink/10 dark:border-dark-border bg-white dark:bg-dark-surface p-4 hover:border-forest/40 transition-colors"
              >
                <span className="w-10 h-10 rounded-xl bg-gold/15 text-gold-dark flex items-center justify-center shrink-0">
                  <Undo2 size={18} />
                </span>
                <span>
                  <span className="block text-sm font-medium">Retou machandiz</span>
                  <span className="block text-xs text-ink/50 dark:text-paper/50">
                    Antre yon pwodwi ki retounen
                  </span>
                </span>
              </a>
            </div>
          </section>

          <section className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-display text-base">Stok fèb</h2>
              {stats.lowStock.length > 0 && (
                <span className="text-xs text-brick">{stats.lowStock.length} atik</span>
              )}
            </div>
            <div className="rounded-card border border-ink/10 dark:border-dark-border overflow-hidden bg-white dark:bg-dark-surface">
              {stats.lowStock.length === 0 ? (
                <p className="text-sm text-ink/40 dark:text-paper/40 text-center py-6">
                  Tout stok anfòm — oswa ou poko ajoute pwodwi.
                </p>
              ) : (
                stats.lowStock.map((item, i) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between px-4 py-3 text-sm ${
                      i > 0 ? "border-t border-ink/8 dark:border-dark-border/60" : ""
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <AlertTriangle size={15} className="text-gold-dark" />
                      {item.name}
                    </span>
                    <span className="text-ink/50 dark:text-paper/50 text-xs">
                      {item.stock} / min {item.minStock}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>

          <section>
            <h2 className="font-display text-base mb-2 flex items-center gap-2">
              <Trophy size={16} className="text-gold-dark" /> Dènye vant
            </h2>
            <div className="rounded-card border border-ink/10 dark:border-dark-border overflow-hidden bg-white dark:bg-dark-surface">
              {stats.recentSales.length === 0 ? (
                <p className="text-sm text-ink/40 dark:text-paper/40 text-center py-6">
                  Poko gen vant jodi a.
                </p>
              ) : (
                stats.recentSales.map((sale, i) => (
                  <div
                    key={sale.id}
                    className={`flex items-center justify-between px-4 py-3 text-sm ${
                      i > 0 ? "border-t border-ink/8 dark:border-dark-border/60" : ""
                    }`}
                  >
                    <span className="stat-figure text-ink/60 dark:text-paper/60">
                      {sale.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span className="text-right">
                      <span className="stat-figure block font-medium">{fmt(sale.total)}</span>
                      <span className="block text-xs text-ink/40 dark:text-paper/40">
                        {new Date(sale.createdAt).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        </>
      )}

      {showForm && (
        <BusinessForm
          onSave={handleCreateBusiness}
          onClose={() => setShowForm(false)}
          saving={savingBusiness}
        />
      )}
    </main>
  );
}
