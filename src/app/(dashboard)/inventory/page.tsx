"use client";

import { useEffect, useState, useCallback } from "react";
import { ClipboardCheck, Loader2, AlertTriangle, History } from "lucide-react";
import { BusinessSwitcher } from "@/components/dashboard/business-switcher";
import { useLanguage } from "@/lib/i18n/language-provider";
import type { Business, Product } from "@/types";
import type { InventorySession } from "@/app/api/inventory/route";

export default function InventoryPage() {
  const { t } = useLanguage();
  const [businesses, setBusinesses] = useState<Business[] | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [sessions, setSessions] = useState<InventorySession[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/businesses")
      .then((res) => res.json())
      .then((data) => setBusinesses(data.businesses ?? []))
      .catch(() => setBusinesses([]));
  }, []);

  const load = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const [productsRes, historyRes] = await Promise.all([
        fetch(`/api/products?businessId=${businessId}`).then((r) => r.json()),
        fetch(`/api/inventory?businessId=${businessId}`).then((r) => r.json()),
      ]);
      const prods = (productsRes.products ?? []).filter(Boolean) as Product[];
      setProducts(prods);
      setCounts(Object.fromEntries(prods.map((p) => [p.id, p.stock])));
      setSessions((historyRes.sessions ?? []).filter(Boolean));
    } catch {
      setProducts([]);
    }
    setLoading(false);
  }, [businessId]);

  useEffect(() => {
    load();
  }, [load]);

  function updateCount(productId: string, value: number) {
    setCounts((prev) => ({ ...prev, [productId]: value }));
  }

  async function handleSubmit() {
    if (!businessId || products.length === 0) return;
    setSubmitting(true);
    setStatus(null);
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          counts: products.map((p) => ({
            productId: p.id,
            countedQty: counts[p.id] ?? p.stock,
          })),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setStatus(data.error || "Pa ka konfime envantè a.");
        setSubmitting(false);
        return;
      }
      setStatus(t("inventory_success"));
      await load();
    } catch {
      setStatus("Erè rezo — eseye ankò.");
    }
    setSubmitting(false);
  }

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
        <ClipboardCheck size={28} className="mx-auto mb-3 text-ink/30" />
        <p className="text-sm text-ink/60 dark:text-paper/60">{t("inventory_need_business")}</p>
      </main>
    );
  }

  if (!businessId) {
    return (
      <main className="max-w-3xl mx-auto px-4 lg:px-8 py-8">
        <BusinessSwitcher
          businesses={businesses.map((b) => ({ id: b.id, name: b.name, icon: b.icon }))}
          activeId=""
          onSelect={setBusinessId}
          showOverviewTab={false}
        />
        <p className="text-sm text-center text-ink/40 dark:text-paper/40 py-10">
          {t("choose_business_prompt")}
        </p>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 lg:px-8 py-8 pb-16">
      <h1 className="font-display text-xl lg:text-2xl mb-1">{t("inventory_title")}</h1>
      <p className="text-sm text-ink/60 dark:text-paper/60 mb-4">{t("inventory_subtitle")}</p>

      <BusinessSwitcher
        businesses={businesses.map((b) => ({ id: b.id, name: b.name, icon: b.icon }))}
        activeId={businessId}
        onSelect={setBusinessId}
        showOverviewTab={false}
      />

      {loading ? (
        <div className="flex justify-center py-10 text-ink/40 dark:text-paper/40">
          <Loader2 size={20} className="animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <p className="text-sm text-center text-ink/40 dark:text-paper/40 py-10 mt-4">
          {t("inventory_no_products")}
        </p>
      ) : (
        <>
          <div className="rounded-card border border-ink/10 dark:border-dark-border bg-white dark:bg-dark-surface overflow-hidden my-5">
            {products.map((p, i) => {
              const counted = counts[p.id] ?? p.stock;
              const diff = counted - p.stock;
              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between gap-3 px-4 py-3 ${
                    i > 0 ? "border-t border-ink/8 dark:border-dark-border/60" : ""
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-ink/40 dark:text-paper/40">
                      {t("inventory_system_qty")}: {p.stock}
                      {diff !== 0 && (
                        <span className={diff > 0 ? "text-forest" : "text-brick"}>
                          {" "}
                          ({diff > 0 ? "+" : ""}
                          {diff})
                        </span>
                      )}
                    </p>
                  </div>
                  <input
                    type="number"
                    min={0}
                    value={counted}
                    onChange={(e) => updateCount(p.id, Number(e.target.value))}
                    className="w-20 shrink-0 border border-ink/15 dark:border-dark-border bg-white dark:bg-dark-surface rounded px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-forest/30"
                  />
                </div>
              );
            })}
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-forest text-paper rounded-full py-3 text-sm font-medium disabled:opacity-50"
          >
            {submitting ? t("inventory_submitting") : t("inventory_submit")}
          </button>
          {status && <p className="text-sm text-center text-ink/60 dark:text-paper/60 mt-3">{status}</p>}
        </>
      )}

      <h2 className="font-display text-base mt-8 mb-2 flex items-center gap-2">
        <History size={16} /> {t("inventory_history")}
      </h2>
      {sessions.length === 0 ? (
        <p className="text-sm text-center text-ink/40 dark:text-paper/40 py-8">
          {t("inventory_history_empty")}
        </p>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="rounded-card border border-ink/10 dark:border-dark-border bg-white dark:bg-dark-surface p-4"
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium">
                  {new Date(s.createdAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <span className="text-xs text-ink/40 dark:text-paper/40">
                  {s.itemsCounted} {t("inventory_no_diff")}
                </span>
              </div>
              {s.discrepancies.length === 0 ? (
                <p className="text-xs text-forest">{t("inventory_no_discrepancy")}</p>
              ) : (
                <p className="text-xs text-gold-dark flex items-center gap-1">
                  <AlertTriangle size={12} /> {s.discrepancies.length} {t("inventory_discrepancies")}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
