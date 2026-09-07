"use client";

import { useEffect, useState, useCallback } from "react";
import { MonitorPlay, Plus, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { BusinessSwitcher } from "@/components/dashboard/business-switcher";
import { useLanguage } from "@/lib/i18n/language-provider";
import type { Business } from "@/types";
import type { Subscription } from "@/app/api/subscriptions/route";

function fmt(n: number) {
  return `${n.toLocaleString("fr-FR")} G`;
}

const inputClass =
  "w-full border border-ink/15 dark:border-dark-border bg-white dark:bg-dark-surface rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30";

export default function SubscriptionsPage() {
  const { t } = useLanguage();
  const STATUS_LABEL: Record<Subscription["status"], string> = {
    active: t("subscriptions_status_active"),
    expired: t("subscriptions_status_expired"),
    cancelled: t("subscriptions_status_cancelled"),
  };
  const STATUS_STYLE: Record<Subscription["status"], string> = {
    active: "bg-emerald-100 text-emerald-700",
    expired: "bg-brick/10 text-brick",
    cancelled: "bg-ink/10 dark:bg-paper/10 text-ink/50 dark:text-paper/50",
  };

  const [businesses, setBusinesses] = useState<Business[] | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [working, setWorking] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState("");
  const [productName, setProductName] = useState("");
  const [monthlyPrice, setMonthlyPrice] = useState(0);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/businesses")
      .then((res) => res.json())
      .then((data) => {
        setBusinesses(data.businesses ?? []);
      })
      .catch(() => setBusinesses([]));
  }, []);

  const load = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/subscriptions?businessId=${businessId}`);
      const data = await res.json();
      setSubs((data.subscriptions ?? []).filter(Boolean));
      setMonthlyRevenue(data.monthlyRevenue ?? 0);
    } catch {
      setSubs([]);
    }
    setLoading(false);
  }, [businessId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!businessId || !customerName.trim() || !productName.trim() || monthlyPrice <= 0) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, customerName, productName, monthlyPrice, startDate }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Pa ka kreye abònman an.");
        setSaving(false);
        return;
      }
      setCustomerName("");
      setProductName("");
      setMonthlyPrice(0);
      setShowForm(false);
      await load();
    } catch {
      setError("Erè rezo — eseye ankò.");
    }
    setSaving(false);
  }

  async function handleMarkPaid(id: string) {
    setWorking(id);
    try {
      await fetch(`/api/subscriptions/${id}/pay`, { method: "POST" });
      await load();
    } catch {
      // silans
    }
    setWorking(null);
  }

  async function handleCancel(id: string) {
    if (!confirm("Anile abònman sa a?")) return;
    setWorking(id);
    try {
      await fetch(`/api/subscriptions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      await load();
    } catch {
      // silans
    }
    setWorking(null);
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
        <MonitorPlay size={28} className="mx-auto mb-3 text-ink/30" />
        <p className="text-sm text-ink/60 dark:text-paper/60">{t("subscriptions_need_business")}</p>
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
    <main className="max-w-3xl mx-auto px-4 lg:px-8 py-8 pb-24">
      <div className="flex items-start justify-between mb-4">
        <h1 className="font-display text-xl lg:text-2xl">{t("subscriptions_title")}</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 bg-forest text-paper rounded-full px-4 py-2.5 text-sm font-medium shrink-0"
        >
          <Plus size={16} /> {t("subscriptions_add")}
        </button>
      </div>

      <BusinessSwitcher
        businesses={businesses.map((b) => ({ id: b.id, name: b.name, icon: b.icon }))}
        activeId={businessId ?? ""}
        onSelect={setBusinessId}
        showOverviewTab={false}
      />

      <div className="rounded-card p-5 my-5 bg-gradient-to-br from-forest to-forest-light text-paper">
        <p className="text-xs uppercase tracking-wide text-gold-light mb-1">
          {t("subscriptions_monthly_revenue")}
        </p>
        <p className="font-display text-2xl">{fmt(monthlyRevenue)}</p>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-card border border-ink/10 dark:border-dark-border bg-white dark:bg-dark-surface p-5 mb-6 space-y-4"
        >
          <label className="block">
            <span className="block text-xs font-medium text-ink/70 dark:text-paper/70 mb-1">
              {t("subscriptions_customer_name")}
            </span>
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className={inputClass}
              required
            />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-ink/70 dark:text-paper/70 mb-1">
              {t("subscriptions_product")}
            </span>
            <input
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className={inputClass}
              placeholder="Netflix, IPTV, Spotify..."
              required
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-xs font-medium text-ink/70 dark:text-paper/70 mb-1">
                {t("subscriptions_monthly_price")}
              </span>
              <input
                type="number"
                min={1}
                value={monthlyPrice || ""}
                onChange={(e) => setMonthlyPrice(Number(e.target.value))}
                className={inputClass}
                required
              />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-ink/70 dark:text-paper/70 mb-1">
                {t("subscriptions_start_date")}
              </span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputClass}
                required
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-ink text-paper rounded-full py-2.5 text-sm font-medium disabled:opacity-50"
          >
            {saving ? t("subscriptions_creating") : t("subscriptions_create")}
          </button>
          {error && <p className="text-sm text-brick text-center">{error}</p>}
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-10 text-ink/40 dark:text-paper/40">
          <Loader2 size={20} className="animate-spin" />
        </div>
      ) : subs.length === 0 ? (
        <p className="text-sm text-center text-ink/40 dark:text-paper/40 py-10">
          {t("subscriptions_empty")}
        </p>
      ) : (
        <div className="space-y-2">
          {subs.map((s) => (
            <div
              key={s.id}
              className="rounded-card border border-ink/10 dark:border-dark-border bg-white dark:bg-dark-surface p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-medium">
                    {s.customerName} — {s.productName}
                  </p>
                  <p className="text-xs text-ink/50 dark:text-paper/50">
                    {t("subscriptions_next_payment")}: {new Date(s.nextPaymentDate).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full shrink-0 ${STATUS_STYLE[s.status]}`}>
                  {STATUS_LABEL[s.status]}
                </span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="stat-figure text-sm font-medium">{fmt(s.monthlyPrice)} /mwa</p>
                {s.status !== "cancelled" && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleMarkPaid(s.id)}
                      disabled={working === s.id}
                      className="flex items-center gap-1 text-xs font-medium text-forest disabled:opacity-40"
                    >
                      <CheckCircle2 size={13} /> {t("subscriptions_mark_paid")}
                    </button>
                    <button
                      onClick={() => handleCancel(s.id)}
                      disabled={working === s.id}
                      className="flex items-center gap-1 text-xs font-medium text-brick disabled:opacity-40"
                    >
                      <XCircle size={13} /> {t("subscriptions_cancel")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
