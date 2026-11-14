"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle,
  Trophy,
  Plus,
  Loader2,
  ShoppingCart,
  Package,
  Undo2,
  Coins,
  CalendarClock,
  TrendingUp,
  Wallet,
  CheckCircle2,
  RefreshCcw,
  BadgeDollarSign,
  HandCoins,
  Boxes,
  ClipboardList,
  BellRing,
} from "lucide-react";
import { DashShell } from "@/components/dashboard/dash-shell";
import { HeroCard } from "@/components/dashboard/hero-card";
import { BusinessSwitcher } from "@/components/dashboard/business-switcher";
import { StatCard } from "@/components/dashboard/stat-card";
import { BusinessBreakdown } from "@/components/dashboard/business-breakdown";
import { BusinessForm, type BusinessFormValues } from "@/components/business/business-form";
import { useLanguage } from "@/lib/i18n/language-provider";
import type { Business, DashboardStats } from "@/types";

function fmt(n: number) {
  return `${n.toLocaleString("fr-FR")} G`;
}

export default function DashboardPage() {
  return (
    <DashShell>
      <DashboardInner />
    </DashShell>
  );
}

interface StatsLike {
  todayRevenue: number;
  monthRevenue: number;
  yearRevenue: number;
  monthSales: number;
  monthReturns: number;
  monthExpenses: number;
  monthProfit: number;
  outOfStockCount: number;
  ordersCount: number;
  newOrdersCount: number;
  lowStockCount: number;
  stockValue: number;
}

function StatsGrid({ s, t }: { s: StatsLike; t: (k: any) => string }) {
  return (
    <div className="grid grid-cols-2 gap-3 mb-8">
      <a href="/orders" className="block">
        <StatCard icon={ClipboardList} label={t("dashboard_orders_total")} value={String(s.ordersCount)} />
      </a>
      <a href="/orders" className="block">
        <StatCard icon={BellRing} tone="gold" label={t("dashboard_orders_new")} value={String(s.newOrdersCount)} />
      </a>
      <StatCard icon={Coins} tone="gold" label={t("dashboard_today_revenue")} value={fmt(s.todayRevenue)} />
      <StatCard icon={CalendarClock} label={t("dashboard_month_revenue")} value={fmt(s.monthRevenue)} />
      <StatCard icon={TrendingUp} tone="gold" label={t("dashboard_year_revenue")} value={fmt(s.yearRevenue)} />
      <StatCard icon={Wallet} label={t("dashboard_month_sales")} value={String(s.monthSales)} />
      <StatCard icon={CheckCircle2} label={t("dashboard_month_returns")} value={fmt(s.monthReturns)} />
      <StatCard icon={RefreshCcw} label={t("dashboard_month_expenses")} value={fmt(s.monthExpenses)} />
      <StatCard icon={BadgeDollarSign} accent label={t("dashboard_month_profit")} value={fmt(s.monthProfit)} />
      <StatCard icon={HandCoins} label={t("dashboard_out_of_stock")} value={String(s.outOfStockCount)} />
      <StatCard icon={AlertTriangle} label={t("dashboard_low_stock_count")} value={String(s.lowStockCount)} />
      <StatCard icon={Boxes} label={t("dashboard_stock_value")} value={fmt(s.stockValue)} />
    </div>
  );
}

function DashboardInner() {
  const { t } = useLanguage();
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
                monthReturns: 0,
                yearRevenue: 0,
                outOfStockCount: 0,
                ordersCount: 0,
                newOrdersCount: 0,
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
      <main className="max-w-3xl mx-auto px-4 py-16 flex flex-col items-center text-ink/40 dark:text-white/40">
        <Loader2 size={24} className="animate-spin mb-2" />
        <p className="text-sm">{t("dashboard_loading")}</p>
      </main>
    );
  }

  // Okenn antrepriz — envite kreye premye a
  if (businesses.length === 0) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-xl font-semibold mb-2">{t("dashboard_welcome")}</p>
        <p className="text-sm text-ink/60 dark:text-white/60 mb-6">
          {t("dashboard_no_business")}
        </p>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 bg-brick text-white rounded-lg px-5 py-2.5 text-sm font-medium"
        >
          <Plus size={16} /> {t("dashboard_add_first_business")}
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

  const empireStats = {
    todayRevenue: Object.values(statsByBusiness).reduce((s, b) => s + (b?.todayRevenue ?? 0), 0),
    monthRevenue: Object.values(statsByBusiness).reduce((s, b) => s + (b?.monthRevenue ?? 0), 0),
    yearRevenue: Object.values(statsByBusiness).reduce((s, b) => s + (b?.yearRevenue ?? 0), 0),
    monthSales: Object.values(statsByBusiness).reduce((s, b) => s + (b?.monthSales ?? 0), 0),
    monthReturns: Object.values(statsByBusiness).reduce((s, b) => s + (b?.monthReturns ?? 0), 0),
    monthExpenses: Object.values(statsByBusiness).reduce((s, b) => s + (b?.monthExpenses ?? 0), 0),
    monthProfit: Object.values(statsByBusiness).reduce((s, b) => s + (b?.monthProfit ?? 0), 0),
    outOfStockCount: Object.values(statsByBusiness).reduce((s, b) => s + (b?.outOfStockCount ?? 0), 0),
    lowStockCount: Object.values(statsByBusiness).reduce((s, b) => s + (b?.lowStock.length ?? 0), 0),
    ordersCount: Object.values(statsByBusiness).reduce((s, b) => s + (b?.ordersCount ?? 0), 0),
    newOrdersCount: Object.values(statsByBusiness).reduce((s, b) => s + (b?.newOrdersCount ?? 0), 0),
    stockValue: Object.values(statsByBusiness).reduce((s, b) => s + (b?.stockValue ?? 0), 0),
  };

  const switcherBusinesses = businesses.map((b) => ({ id: b.id, name: b.name, icon: b.icon }));

  if (activeId === "all") {
    return (
      <main className="max-w-3xl mx-auto px-4 py-5">
        <div className="flex items-center justify-between mb-3">
          <BusinessSwitcher
            businesses={switcherBusinesses}
            activeId={activeId}
            onSelect={setActiveId}
          />
          <button
            onClick={() => setShowForm(true)}
            aria-label={t("dashboard_add_first_business")}
            className="w-10 h-10 shrink-0 rounded-lg border border-ink text-ink dark:border-white dark:text-white hover:bg-ink hover:text-white dark:hover:bg-white dark:hover:text-ink flex items-center justify-center ml-2 transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="mt-5 mb-5">
          <HeroCard
            label={t("dashboard_consolidated")}
            value={loadingStats ? "..." : fmt(empireStats.todayRevenue)}
            sub={`${businesses.length} ${t("dashboard_active_businesses")}`}
          />
        </div>

        {loadingStats ? (
          <div className="flex justify-center py-10 text-ink/40 dark:text-white/40">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : (
          <StatsGrid s={empireStats} t={t} />
        )}

        <h2 className="text-base font-semibold mb-2">{t("dashboard_breakdown")}</h2>
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
    <main className="max-w-3xl mx-auto px-4 py-5">
      <div className="flex items-center justify-between mb-3">
        <BusinessSwitcher
          businesses={switcherBusinesses}
          activeId={activeId}
          onSelect={setActiveId}
        />
        <button
          onClick={() => setShowForm(true)}
          aria-label={t("dashboard_add_first_business")}
          className="w-10 h-10 shrink-0 rounded-lg border border-ink text-ink dark:border-white dark:text-white hover:bg-ink hover:text-white dark:hover:bg-white dark:hover:text-ink flex items-center justify-center ml-2 transition-colors"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="flex items-baseline justify-between mt-6 mb-4">
        <h1 className="text-xl font-semibold">{activeBusiness.name}</h1>
        <p className="text-xs text-ink/50 dark:text-white/50">
          {new Date().toLocaleDateString(
            "fr-FR",
            { weekday: "long", day: "numeric", month: "long" }
          )}
        </p>
      </div>

      {!stats ? (
        <div className="flex justify-center py-10 text-ink/40 dark:text-white/40">
          <Loader2 size={20} className="animate-spin" />
        </div>
      ) : (
        <>
          <StatsGrid s={{ ...stats, ordersCount: stats.ordersCount ?? 0, newOrdersCount: stats.newOrdersCount ?? 0, lowStockCount: stats.lowStock.length }} t={t} />

          <section className="mb-8">
            <p className="text-xs font-medium text-ink/50 dark:text-white/40 mb-2">
              {t("dashboard_quick_access")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <a
                href="/pos"
                className="flex items-center gap-3 rounded-card border border-line dark:border-dark-border bg-white dark:bg-dark-surface p-4 hover:border-ink dark:hover:border-white transition-colors"
              >
                <span className="w-10 h-10 rounded-md bg-brick text-white flex items-center justify-center shrink-0">
                  <ShoppingCart size={18} />
                </span>
                <span>
                  <span className="block text-sm font-medium">{t("dashboard_open_pos")}</span>
                  <span className="block text-xs text-ink/50 dark:text-white/50">
                    {t("dashboard_open_pos_sub")}
                  </span>
                </span>
              </a>
              <a
                href="/products"
                className="flex items-center gap-3 rounded-card border border-line dark:border-dark-border bg-white dark:bg-dark-surface p-4 hover:border-ink dark:hover:border-white transition-colors"
              >
                <span className="w-10 h-10 rounded-md bg-ink text-white dark:bg-white dark:text-ink flex items-center justify-center shrink-0">
                  <Package size={18} />
                </span>
                <span>
                  <span className="block text-sm font-medium">{t("dashboard_manage_products")}</span>
                  <span className="block text-xs text-ink/50 dark:text-white/50">
                    {t("dashboard_manage_products_sub")}
                  </span>
                </span>
              </a>
              <a
                href="/returns"
                className="flex items-center gap-3 rounded-card border border-line dark:border-dark-border bg-white dark:bg-dark-surface p-4 hover:border-ink dark:hover:border-white transition-colors"
              >
                <span className="w-10 h-10 rounded-md bg-mist text-ink dark:bg-white/10 dark:text-white flex items-center justify-center shrink-0">
                  <Undo2 size={18} />
                </span>
                <span>
                  <span className="block text-sm font-medium">{t("dashboard_returns_shortcut")}</span>
                  <span className="block text-xs text-ink/50 dark:text-white/50">
                    {t("dashboard_returns_shortcut_sub")}
                  </span>
                </span>
              </a>
            </div>
          </section>

          <section className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-semibold">{t("dashboard_low_stock")}</h2>
              {stats.lowStock.length > 0 && (
                <span className="text-xs text-brick">{stats.lowStock.length}</span>
              )}
            </div>
            <div className="rounded-card border border-line dark:border-dark-border overflow-hidden bg-white dark:bg-dark-surface">
              {stats.lowStock.length === 0 ? (
                <p className="text-sm text-ink/40 dark:text-white/40 text-center py-6">
                  {t("dashboard_all_ok")}
                </p>
              ) : (
                stats.lowStock.map((item, i) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between px-4 py-3 text-sm ${
                      i > 0 ? "border-t border-line dark:border-dark-border/60" : ""
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <AlertTriangle size={15} className="text-brick" />
                      {item.name}
                    </span>
                    <span className="text-ink/50 dark:text-white/50 text-xs">
                      {item.stock} / min {item.minStock}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2 flex items-center gap-2">
              <Trophy size={16} className="text-brick" /> {t("dashboard_recent_sales")}
            </h2>
            <div className="rounded-card border border-line dark:border-dark-border overflow-hidden bg-white dark:bg-dark-surface">
              {stats.recentSales.length === 0 ? (
                <p className="text-sm text-ink/40 dark:text-white/40 text-center py-6">
                  {t("dashboard_no_sales_today")}
                </p>
              ) : (
                stats.recentSales.map((sale, i) => (
                  <div
                    key={sale.id}
                    className={`flex items-center justify-between px-4 py-3 text-sm ${
                      i > 0 ? "border-t border-line dark:border-dark-border/60" : ""
                    }`}
                  >
                    <span className="stat-figure text-ink/60 dark:text-white/60">
                      {sale.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span className="text-right">
                      <span className="stat-figure block font-medium">{fmt(sale.total)}</span>
                      <span className="block text-xs text-ink/40 dark:text-white/40">
                        {new Date(sale.createdAt).toLocaleTimeString(
                          "fr-FR",
                          { hour: "2-digit", minute: "2-digit" }
                        )}
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
