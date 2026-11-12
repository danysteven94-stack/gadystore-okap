"use client";

import { useEffect, useState } from "react";
import { WalletCards, Loader2, ShieldCheck, RefreshCw, AlertTriangle, CalendarClock } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-provider";
import type { BillingUser } from "@/app/api/user-billing/route";

interface Summary {
  total: number;
  overdue: number;
  dueToday: number;
  soon: number;
  monthlyRevenue: number;
  totalOwed: number;
}

const inputClass =
  "w-full border border-ink/15 dark:border-dark-border bg-white dark:bg-dark-surface rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30";
const labelClass = "block text-[11px] font-bold tracking-[0.12em] uppercase text-ink/60 dark:text-paper/60 mb-1";

const fmtG = (n: number) => `${n.toLocaleString("fr-FR")} G`;

export default function UserBillingPage() {
  const { t, lang } = useLanguage();
  const [users, setUsers] = useState<BillingUser[] | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [months, setMonths] = useState<Record<string, number>>({});

  const locale = lang === "en" ? "en-US" : "fr-FR";
  const fmtDate = (ymd: string) =>
    ymd
      ? new Date(`${ymd}T12:00:00Z`).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
      : "";
  const fmtIso = (iso: string) => {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? "" : d.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
  };
  const fill = (key: Parameters<typeof t>[0], n: number) => t(key).replace("{n}", String(n));

  async function load() {
    try {
      const res = await fetch("/api/user-billing");
      if (res.status === 403) {
        setForbidden(true);
        setUsers([]);
        return;
      }
      const data = await res.json();
      setUsers(data.users ?? []);
      setSummary(data.summary ?? null);
      setPrices(Object.fromEntries((data.users ?? []).map((u: BillingUser) => [u.email, String(u.monthlyPrice)])));
    } catch {
      setUsers([]);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function patch(email: string, body: Record<string, unknown>) {
    setBusy(email);
    setError(null);
    try {
      const res = await fetch("/api/user-billing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, ...body }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error || "Erè — eseye ankò.");
      else await load();
    } catch {
      setError("Erè rezo — eseye ankò.");
    }
    setBusy(null);
  }

  if (users === null) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 flex flex-col items-center text-ink/40 dark:text-paper/40">
        <Loader2 size={24} className="animate-spin mb-2" />
        <p className="text-sm">Ap chaje...</p>
      </main>
    );
  }

  if (forbidden) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 text-center">
        <ShieldCheck size={28} className="mx-auto mb-3 text-ink/30" />
        <p className="text-sm text-ink/60 dark:text-paper/60">{t("ub_forbidden")}</p>
      </main>
    );
  }

  const badge = (u: BillingUser) => {
    if (u.status === "overdue") return { cls: "bg-brick", text: fill("ub_status_overdue", u.monthsOverdue) };
    if (u.status === "due_today") return { cls: "bg-brick", text: t("ub_status_today") };
    if (u.status === "soon") return { cls: "bg-amber-500", text: fill("ub_status_soon", u.daysUntil) };
    return { cls: "bg-forest", text: t("ub_status_paid") };
  };

  return (
    <main className="max-w-3xl mx-auto px-4 lg:px-8 py-8 pb-24">
      <div className="flex items-end justify-between mb-5">
        <div>
          <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-forest mb-1">
            {users.length} {t("ub_users")}
          </p>
          <h1 className="font-display text-2xl lg:text-3xl">{t("ub_title")}</h1>
        </div>
        <button onClick={load} className="inline-flex items-center gap-1.5 text-sm font-semibold">
          <RefreshCw size={16} />
        </button>
      </div>

      {error && <p className="text-sm text-brick mb-4">{error}</p>}

      {summary && (summary.overdue > 0 || summary.dueToday > 0 || summary.soon > 0) && (
        <div className="rounded-2xl border-2 border-brick/40 bg-brick/5 p-4 mb-5 space-y-1.5 text-sm">
          {summary.overdue > 0 && (
            <p className="flex items-center gap-2 font-semibold text-brick">
              <AlertTriangle size={16} /> {fill("ub_alert_overdue", summary.overdue)}
            </p>
          )}
          {summary.dueToday > 0 && (
            <p className="flex items-center gap-2 font-semibold text-brick">
              <CalendarClock size={16} /> {fill("ub_alert_today", summary.dueToday)}
            </p>
          )}
          {summary.soon > 0 && (
            <p className="flex items-center gap-2 text-amber-600">
              <CalendarClock size={16} /> {fill("ub_alert_soon", summary.soon)}
            </p>
          )}
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-2xl border border-ink/10 dark:border-dark-border bg-white dark:bg-dark-surface p-4">
            <p className={labelClass}>{t("ub_monthly_revenue")}</p>
            <p className="text-lg font-bold">{fmtG(summary.monthlyRevenue)}</p>
          </div>
          <div className="rounded-2xl border border-ink/10 dark:border-dark-border bg-white dark:bg-dark-surface p-4">
            <p className={labelClass}>{t("ub_total_owed")}</p>
            <p className={`text-lg font-bold ${summary.totalOwed > 0 ? "text-brick" : ""}`}>{fmtG(summary.totalOwed)}</p>
          </div>
        </div>
      )}

      {users.length === 0 ? (
        <div className="text-center py-16 text-ink/40 dark:text-paper/40">
          <WalletCards size={28} className="mx-auto mb-2" />
          <p className="text-sm">{t("ub_empty")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => {
            const b = badge(u);
            const day = Number(u.createdYmd.split("-")[2]);
            const priceChanged = (prices[u.email] ?? "") !== String(u.monthlyPrice);
            return (
              <div
                key={u.email}
                className={`rounded-2xl border border-ink/10 dark:border-dark-border bg-white dark:bg-dark-surface p-4 border-l-4 ${
                  u.disabled ? "opacity-60 border-l-ink/30" : u.status === "paid" ? "border-l-forest" : u.status === "soon" ? "border-l-amber-500" : "border-l-brick"
                }`}
              >
                <p className="text-[15px]">
                  <span className="font-bold">{u.fullName || u.email}</span>
                  {u.fullName && <span className="text-ink/50 dark:text-paper/50 text-sm"> {u.email}</span>}
                </p>

                <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                  <span className={`rounded-full px-3 py-1 font-bold text-white ${b.cls}`}>{b.text}</span>
                  {u.amountOwed > 0 && (
                    <span className="font-semibold text-brick">
                      {t("ub_owed")}: {fmtG(u.amountOwed)}
                    </span>
                  )}
                  {u.disabled && <span className="text-ink/55 dark:text-paper/55">{t("ub_disabled")}</span>}
                </div>

                <dl className="mt-3 text-sm space-y-1">
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink/55 dark:text-paper/55">{t("ub_account_since")}</dt>
                    <dd className="font-medium text-right">{fmtDate(u.createdYmd)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink/55 dark:text-paper/55">{t("ub_billing_day")}</dt>
                    <dd className="font-medium">{day}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink/55 dark:text-paper/55">{t("ub_next_payment")}</dt>
                    <dd className={`font-semibold text-right ${u.status === "overdue" || u.status === "due_today" ? "text-brick" : ""}`}>
                      {fmtDate(u.nextDue)}
                    </dd>
                  </div>
                  {u.lastPaymentAt && fmtIso(u.lastPaymentAt) && (
                    <div className="flex justify-between gap-3">
                      <dt className="text-ink/55 dark:text-paper/55">{t("ub_last_payment")}</dt>
                      <dd className="text-right">{fmtIso(u.lastPaymentAt)}</dd>
                    </div>
                  )}
                </dl>

                <div className="mt-3 pt-3 border-t border-ink/8 dark:border-dark-border/60 space-y-3">
                  <div className="flex items-end gap-2">
                    <label className="flex-1">
                      <span className={labelClass}>{t("ub_price")}</span>
                      <input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        value={prices[u.email] ?? ""}
                        onChange={(e) => setPrices((p) => ({ ...p, [u.email]: e.target.value }))}
                        className={inputClass}
                      />
                    </label>
                    {priceChanged && (
                      <button
                        disabled={busy === u.email}
                        onClick={() => patch(u.email, { action: "set_price", price: Number(prices[u.email]) || 0 })}
                        className="rounded-xl bg-ink text-paper px-4 py-2 text-sm font-semibold disabled:opacity-50"
                      >
                        {t("ub_price_save")}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={months[u.email] ?? 1}
                      onChange={(e) => setMonths((m) => ({ ...m, [u.email]: Number(e.target.value) }))}
                      className={`${inputClass} !w-auto`}
                    >
                      {[1, 2, 3, 6, 12].map((n) => (
                        <option key={n} value={n}>
                          {n} {t("ub_months")}
                        </option>
                      ))}
                    </select>
                    <button
                      disabled={busy === u.email}
                      onClick={() => patch(u.email, { action: "pay", months: months[u.email] ?? 1 })}
                      className="rounded-xl bg-forest text-paper px-4 py-2 text-sm font-semibold disabled:opacity-50"
                    >
                      {t("ub_mark_paid")}
                    </button>
                    <button
                      disabled={busy === u.email}
                      onClick={() => {
                        if (confirm(`${t("ub_undo_confirm")}\n\n${u.fullName || u.email}`)) patch(u.email, { action: "undo" });
                      }}
                      className="ml-auto text-xs underline underline-offset-2 text-ink/60 dark:text-paper/60 disabled:opacity-50"
                    >
                      {t("ub_undo")}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
