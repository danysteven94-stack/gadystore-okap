"use client";

import { useEffect, useState, useCallback } from "react";
import { ClipboardList, Plus, Loader2, X } from "lucide-react";
import { BusinessSwitcher } from "@/components/dashboard/business-switcher";
import { useLanguage } from "@/lib/i18n/language-provider";
import type { Business } from "@/types";
import type { Order } from "@/app/api/orders/route";

function fmt(n: number) {
  return `${n.toLocaleString("fr-FR")} G`;
}

const inputClass =
  "w-full border border-ink/15 dark:border-dark-border bg-white dark:bg-dark-surface rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30";

const STATUS_STYLE: Record<Order["status"], string> = {
  paid: "bg-emerald-100 text-emerald-700",
  partial: "bg-gold/20 text-gold-dark",
  pending: "bg-brick/10 text-brick",
};

export default function OrdersPage() {
  const { t } = useLanguage();
  const STATUS_LABEL: Record<Order["status"], string> = {
    paid: t("orders_paid_status"),
    partial: t("orders_partial_status"),
    pending: t("orders_pending_status"),
  };

  const [businesses, setBusinesses] = useState<Business[] | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [description, setDescription] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);
  const [depositAmount, setDepositAmount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [payTarget, setPayTarget] = useState<Order | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [paying, setPaying] = useState(false);

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
      const res = await fetch(`/api/orders?businessId=${businessId}`);
      const data = await res.json();
      setOrders((data.orders ?? []).filter(Boolean));
      setTotalOutstanding(data.totalOutstanding ?? 0);
    } catch {
      setOrders([]);
    }
    setLoading(false);
  }, [businessId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!businessId || !customerName.trim() || !description.trim() || totalAmount <= 0) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, customerName, description, totalAmount, depositAmount }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Pa ka kreye kòmand lan.");
        setSaving(false);
        return;
      }
      setCustomerName("");
      setDescription("");
      setTotalAmount(0);
      setDepositAmount(0);
      setShowForm(false);
      await load();
    } catch {
      setError("Erè rezo — eseye ankò.");
    }
    setSaving(false);
  }

  async function handleAddPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!payTarget || payAmount <= 0) return;
    setPaying(true);
    try {
      const res = await fetch(`/api/orders/${payTarget.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: payAmount }),
      });
      if (res.ok) {
        setPayTarget(null);
        setPayAmount(0);
        await load();
      }
    } catch {
      // silans — status rete menm jan
    }
    setPaying(false);
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
        <ClipboardList size={28} className="mx-auto mb-3 text-ink/30" />
        <p className="text-sm text-ink/60 dark:text-paper/60">{t("orders_need_business")}</p>
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
        <h1 className="font-display text-xl lg:text-2xl">{t("orders_title")}</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 bg-forest text-paper rounded-full px-4 py-2.5 text-sm font-medium shrink-0"
        >
          <Plus size={16} /> {t("orders_add")}
        </button>
      </div>

      <BusinessSwitcher
        businesses={businesses.map((b) => ({ id: b.id, name: b.name, icon: b.icon }))}
        activeId={businessId ?? ""}
        onSelect={setBusinessId}
        showOverviewTab={false}
      />

      <div className="rounded-card p-5 my-5 bg-ink dark:bg-dark-surface text-paper">
        <p className="text-xs uppercase tracking-wide text-paper/50 mb-1">{t("orders_outstanding")}</p>
        <p className="font-display text-2xl">{fmt(totalOutstanding)}</p>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-card border border-ink/10 dark:border-dark-border bg-white dark:bg-dark-surface p-5 mb-6 space-y-4"
        >
          <label className="block">
            <span className="block text-xs font-medium text-ink/70 dark:text-paper/70 mb-1">
              {t("orders_customer_name")}
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
              {t("orders_description")}
            </span>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass}
              placeholder="Ekz: 2 telefòn Samsung"
              required
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-xs font-medium text-ink/70 dark:text-paper/70 mb-1">
                {t("orders_total")}
              </span>
              <input
                type="number"
                min={1}
                value={totalAmount || ""}
                onChange={(e) => setTotalAmount(Number(e.target.value))}
                className={inputClass}
                required
              />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-ink/70 dark:text-paper/70 mb-1">
                {t("orders_deposit")}
              </span>
              <input
                type="number"
                min={0}
                value={depositAmount || ""}
                onChange={(e) => setDepositAmount(Number(e.target.value))}
                className={inputClass}
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-ink text-paper rounded-full py-2.5 text-sm font-medium disabled:opacity-50"
          >
            {saving ? t("orders_creating") : t("orders_create")}
          </button>
          {error && <p className="text-sm text-brick text-center">{error}</p>}
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-10 text-ink/40 dark:text-paper/40">
          <Loader2 size={20} className="animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <p className="text-sm text-center text-ink/40 dark:text-paper/40 py-10">{t("orders_empty")}</p>
      ) : (
        <div className="space-y-2">
          {orders.map((o) => (
            <div
              key={o.id}
              className="rounded-card border border-ink/10 dark:border-dark-border bg-white dark:bg-dark-surface p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-medium">{o.customerName}</p>
                  <p className="text-xs text-ink/50 dark:text-paper/50">{o.description}</p>
                </div>
                <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${STATUS_STYLE[o.status]}`}>
                  {STATUS_LABEL[o.status]}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs text-ink/60 dark:text-paper/60 mb-3">
                <div>
                  <p className="text-ink/40 dark:text-paper/40">{t("orders_total")}</p>
                  <p className="stat-figure font-medium text-ink dark:text-paper">{fmt(o.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-ink/40 dark:text-paper/40">{t("orders_deposit_paid")}</p>
                  <p className="stat-figure font-medium text-ink dark:text-paper">{fmt(o.depositAmount)}</p>
                </div>
                <div>
                  <p className="text-ink/40 dark:text-paper/40">{t("orders_balance_due")}</p>
                  <p className="stat-figure font-medium text-brick">{fmt(o.balance)}</p>
                </div>
              </div>
              {o.balance > 0 && (
                <button
                  onClick={() => {
                    setPayTarget(o);
                    setPayAmount(0);
                  }}
                  className="text-xs font-medium text-forest underline underline-offset-2"
                >
                  {t("orders_add_payment")}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {payTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
          <div className="w-full sm:max-w-sm bg-paper dark:bg-dark-bg rounded-t-2xl sm:rounded-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg">{t("orders_add_payment")}</h2>
              <button onClick={() => setPayTarget(null)} aria-label={t("common_close")}>
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-ink/60 dark:text-paper/60 mb-4">
              {payTarget.customerName} — {t("orders_balance_due")}: {fmt(payTarget.balance)}
            </p>
            <form onSubmit={handleAddPayment}>
              <input
                type="number"
                min={1}
                max={payTarget.balance}
                value={payAmount || ""}
                onChange={(e) => setPayAmount(Number(e.target.value))}
                placeholder={t("orders_payment_amount")}
                className={`${inputClass} mb-4`}
                required
                autoFocus
              />
              <button
                type="submit"
                disabled={paying}
                className="w-full bg-forest text-paper rounded-full py-2.5 text-sm font-medium disabled:opacity-50"
              >
                {paying ? "..." : t("orders_payment_submit")}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
