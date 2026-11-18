"use client";

import { useEffect, useState, useCallback } from "react";
import { MonitorPlay, Plus, Loader2, CheckCircle2, XCircle, Undo2, Trash2, Store, UserRound, CalendarClock, MessageCircle } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-provider";
import type { Business } from "@/types";
import type { Subscription } from "@/app/api/subscriptions/route";

function fmt(n: number) {
  return `${n.toLocaleString("fr-FR")} G`;
}

const inputClass =
  "w-full border border-ink/15 dark:border-dark-border bg-white dark:bg-dark-surface rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brick/30";

const ACTIVE = "bg-ink text-white border-ink dark:bg-white dark:text-ink dark:border-white";
const INACTIVE =
  "bg-white text-ink border-line hover:border-ink dark:bg-dark-surface dark:text-white dark:border-dark-border dark:hover:border-white";
const chip = (on: boolean) =>
  `flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors border ${on ? ACTIVE : INACTIVE}`;

type Sub = Subscription & { paymentsCount?: number };

/** Valè pou <input type="datetime-local"> (lè lokal aparèy la). */
function nowLocal() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function lastPaidAt(s: Sub): string {
  let arr: unknown = s.paidDates;
  if (typeof arr === "string") {
    try {
      arr = JSON.parse(arr);
    } catch {
      arr = [];
    }
  }
  return Array.isArray(arr) && arr.length ? String(arr[arr.length - 1]) : "";
}

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? ""
    : d.toLocaleString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** Nimewo pou wa.me: sèlman chif; 8 chif = nimewo Ayiti (ajoute 509). */
function waNumber(raw: string) {
  const d = String(raw ?? "").replace(/\D/g, "");
  return d.length === 8 ? `509${d}` : d;
}

/** Konbyen jou ki rete jiska dat peman an (fizo Ayiti; 0 = jodi a, 1 = demen). */
function daysUntil(ymd: string) {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Port-au-Prince" });
  const [ay, am, ad] = today.split("-").map(Number);
  const [by, bm, bd] = String(ymd).slice(0, 10).split("-").map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000);
}

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
    cancelled: "bg-ink/10 dark:bg-paper/10 text-ink/50 dark:text-white/50",
  };

  // Pa gen antrepriz obligatwa: "" = abònman pèsonèl (default)
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [businessId, setBusinessId] = useState<string>("");
  const [subs, setSubs] = useState<Sub[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [working, setWorking] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [editPhoneId, setEditPhoneId] = useState<string | null>(null);
  const [phoneDraft, setPhoneDraft] = useState("");
  const [productName, setProductName] = useState("");
  const [profile, setProfile] = useState("");
  const [monthlyPrice, setMonthlyPrice] = useState(0);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [paid, setPaid] = useState(true);
  const [paidAt, setPaidAt] = useState(nowLocal());
  const [editProfileId, setEditProfileId] = useState<string | null>(null);
  const [profileDraft, setProfileDraft] = useState("");
  const [editPaidId, setEditPaidId] = useState<string | null>(null);
  const [paidDraft, setPaidDraft] = useState(nowLocal());
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payAt, setPayAt] = useState(nowLocal());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/businesses")
      .then((res) => res.json())
      .then((data) => setBusinesses(data.businesses ?? []))
      .catch(() => setBusinesses([]));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = businessId ? `?businessId=${businessId}` : "";
      const res = await fetch(`/api/subscriptions${qs}`);
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
    if (!customerName.trim() || !productName.trim() || monthlyPrice <= 0) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: businessId || undefined,
          customerName,
          customerPhone: customerPhone.trim() || undefined,
          productName,
          profile: profile.trim() || undefined,
          monthlyPrice,
          startDate,
          paid,
          paidAt: paid && paidAt ? new Date(paidAt).toISOString() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Pa ka kreye abònman an.");
        setSaving(false);
        return;
      }
      setCustomerName("");
      setCustomerPhone("");
      setProductName("");
      setProfile("");
      setMonthlyPrice(0);
      setPaid(true);
      setPaidAt(nowLocal());
      setShowForm(false);
      await load();
    } catch {
      setError("Erè rezo — eseye ankò.");
    }
    setSaving(false);
  }

  async function call(id: string, url: string, init: RequestInit) {
    setWorking(id);
    setError(null);
    try {
      const res = await fetch(url, init);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Erè — eseye ankò.");
      }
      await load();
    } catch {
      setError("Erè rezo — eseye ankò.");
    }
    setWorking(null);
  }

  const handleMarkPaid = async (id: string) => {
    await call(id, `/api/subscriptions/${id}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paidAt: payAt ? new Date(payAt).toISOString() : undefined }),
    });
    setPayingId(null);
  };

  const handleUndoPay = (id: string) => {
    if (!confirm(t("subscriptions_undo_confirm"))) return;
    return call(id, `/api/subscriptions/${id}/pay`, { method: "DELETE" });
  };

  const handleDelete = (id: string) => {
    if (!confirm(t("subscriptions_delete_confirm"))) return;
    return call(id, `/api/subscriptions/${id}`, { method: "DELETE" });
  };

  const saveProfile = async (id: string) => {
    await call(id, `/api/subscriptions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile: profileDraft }),
    });
    setEditProfileId(null);
  };

  const savePaidAt = async (id: string) => {
    await call(id, `/api/subscriptions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paidAt: new Date(paidDraft).toISOString() }),
    });
    setEditPaidId(null);
  };

  const toLocalInput = (iso: string) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return nowLocal();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  const openWhatsApp = (s: Sub, phone: string) => {
    const msg = t("subscriptions_reminder_msg")
      .replace("{name}", s.customerName)
      .replace("{product}", s.productName)
      .replace("{profile}", s.profile ? ` (${s.profile})` : "")
      .replace("{date}", new Date(`${s.nextPaymentDate}T12:00:00`).toLocaleDateString("fr-FR"))
      .replace("{price}", fmt(s.monthlyPrice));
    window.open(`https://wa.me/${waNumber(phone)}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
  };

  const handleReminder = (s: Sub) => {
    const phone = String(s.customerPhone ?? "").trim();
    if (waNumber(phone).length >= 8) return openWhatsApp(s, phone);
    setPhoneDraft("");
    setEditPhoneId(s.id);
  };

  const savePhoneAndSend = async (s: Sub) => {
    if (waNumber(phoneDraft).length < 8) return;
    await call(s.id, `/api/subscriptions/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerPhone: phoneDraft }),
    });
    setEditPhoneId(null);
    openWhatsApp(s, phoneDraft);
  };

  const handleCancel = (id: string) => {
    if (!confirm("Anile abònman sa a?")) return;
    return call(id, `/api/subscriptions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    });
  };

  return (
    <main className="max-w-3xl mx-auto px-4 lg:px-8 py-8 pb-24">
      <div className="flex items-start justify-between mb-4">
        <h1 className="font-display font-semibold text-xl lg:text-2xl">{t("subscriptions_title")}</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 bg-brick hover:bg-brick-dark text-white rounded-md px-4 py-2.5 text-sm font-medium shrink-0"
        >
          <Plus size={16} /> {t("subscriptions_add")}
        </button>
      </div>

      {/* Pèsonèl (san antrepriz) + antrepriz yo si genyen */}
      <div role="tablist" className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <button role="tab" aria-selected={businessId === ""} onClick={() => setBusinessId("")} className={chip(businessId === "")}>
          <MonitorPlay size={16} strokeWidth={1.75} />
          {t("subscriptions_personal")}
        </button>
        {businesses.map((b) => (
          <button key={b.id} role="tab" aria-selected={businessId === b.id} onClick={() => setBusinessId(b.id)} className={chip(businessId === b.id)}>
            <Store size={16} strokeWidth={1.75} />
            {b.name}
          </button>
        ))}
      </div>

      {businessId === "" && (
        <p className="text-xs text-ink/50 dark:text-white/50 mt-2">{t("subscriptions_personal_note")}</p>
      )}

      <div className="rounded-card p-5 my-5 bg-ink text-white border-l-4 border-brick">
        <p className="text-xs uppercase tracking-wide text-gold-light mb-1">{t("subscriptions_monthly_revenue")}</p>
        <p className="font-display font-semibold text-2xl">{fmt(monthlyRevenue)}</p>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-card border border-ink/10 dark:border-dark-border bg-white dark:bg-dark-surface p-5 mb-6 space-y-4"
        >
          <label className="block">
            <span className="block text-xs font-medium text-ink/70 dark:text-white/70 mb-1">{t("subscriptions_customer_name")}</span>
            <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={inputClass} required />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-ink/70 dark:text-white/70 mb-1">{t("subscriptions_customer_phone")}</span>
            <input
              type="tel"
              inputMode="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className={inputClass}
              placeholder={t("subscriptions_phone_placeholder")}
              maxLength={30}
            />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-ink/70 dark:text-white/70 mb-1">{t("subscriptions_product")}</span>
            <input
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className={inputClass}
              placeholder="Netflix, IPTV, Spotify..."
              required
            />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-ink/70 dark:text-white/70 mb-1">{t("subscriptions_profile")}</span>
            <input value={profile} onChange={(e) => setProfile(e.target.value)} className={inputClass} maxLength={60} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-xs font-medium text-ink/70 dark:text-white/70 mb-1">{t("subscriptions_monthly_price")}</span>
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
              <span className="block text-xs font-medium text-ink/70 dark:text-white/70 mb-1">{t("subscriptions_start_date")}</span>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} required />
            </label>
          </div>

          <fieldset>
            <legend className="block text-xs font-medium text-ink/70 dark:text-white/70 mb-1">{t("subscriptions_paid_question")}</legend>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setPaid(true)} className={`rounded-md border px-3 py-2 text-sm font-medium ${paid ? ACTIVE : INACTIVE}`}>
                {t("subscriptions_paid_yes")}
              </button>
              <button type="button" onClick={() => setPaid(false)} className={`rounded-md border px-3 py-2 text-sm font-medium ${!paid ? ACTIVE : INACTIVE}`}>
                {t("subscriptions_paid_no")}
              </button>
            </div>
            {!paid && <p className="text-xs text-ink/50 dark:text-white/50 mt-1.5">{t("subscriptions_paid_no_hint")}</p>}
            {paid && (
              <label className="block mt-3">
                <span className="block text-xs font-medium text-ink/70 dark:text-white/70 mb-1">{t("subscriptions_paid_at")}</span>
                <input type="datetime-local" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} className={inputClass} required />
              </label>
            )}
          </fieldset>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-brick hover:bg-brick-dark text-white rounded-md py-2.5 text-sm font-medium disabled:opacity-50"
          >
            {saving ? t("subscriptions_creating") : t("subscriptions_create")}
          </button>
        </form>
      )}

      {error && <p className="text-sm text-brick text-center mb-4">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-10 text-ink/40 dark:text-white/40">
          <Loader2 size={20} className="animate-spin" />
        </div>
      ) : subs.length === 0 ? (
        <p className="text-sm text-center text-ink/40 dark:text-white/40 py-10">{t("subscriptions_empty")}</p>
      ) : (
        <div className="space-y-2">
          {subs.map((s) => {
            const unpaid = (s.paymentsCount ?? 0) === 0;
            const days = daysUntil(s.nextPaymentDate);
            return (
              <div
                key={s.id}
                className="rounded-card border border-ink/10 dark:border-dark-border bg-white dark:bg-dark-surface p-4 shadow-card dark:shadow-none"
              >
                <div className="flex items-start justify-between mb-2 gap-2">
                  <div>
                    <p className="text-sm font-medium">
                      {s.customerName} — {s.productName}
                    </p>
                    {s.profile && (
                      <p className="text-xs font-medium text-ink/70 dark:text-white/70">
                        {t("subscriptions_profile_short")}: {s.profile}
                      </p>
                    )}
                    <p className="text-xs text-ink/50 dark:text-white/50">
                      {t("subscriptions_started")}: {new Date(`${s.startDate}T12:00:00`).toLocaleDateString("fr-FR")}
                    </p>
                    {lastPaidAt(s) && fmtDateTime(lastPaidAt(s)) && (
                      <p className="text-xs text-ink/50 dark:text-white/50">
                        {t("subscriptions_last_paid")}: {fmtDateTime(lastPaidAt(s))}
                      </p>
                    )}
                    <p className="text-xs text-ink/50 dark:text-white/50">
                      {t("subscriptions_next_payment")}: {new Date(`${s.nextPaymentDate}T12:00:00`).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`text-[11px] font-medium px-2.5 py-1 rounded-md ${STATUS_STYLE[s.status]}`}>
                      {STATUS_LABEL[s.status]}
                    </span>
                    {unpaid && s.status !== "cancelled" && (
                      <span className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-amber-100 text-amber-700">
                        {t("subscriptions_unpaid")}
                      </span>
                    )}
                    {s.status !== "cancelled" && (days === 1 || days === 0) && (
                      <span className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-sky-100 text-sky-700">
                        {days === 1 ? t("subscriptions_due_tomorrow") : t("subscriptions_due_today")}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2 gap-2">
                  <p className="stat-figure text-sm font-medium">{fmt(s.monthlyPrice)} /mwa</p>
                  <div className="flex flex-wrap justify-end gap-x-3 gap-y-1">
                    {s.status !== "cancelled" && (
                      <button
                        onClick={() => {
                          setPayAt(nowLocal());
                          setPayingId(payingId === s.id ? null : s.id);
                        }}
                        disabled={working === s.id}
                        className="flex items-center gap-1 text-xs font-medium text-forest dark:text-green-400 disabled:opacity-40"
                      >
                        <CheckCircle2 size={13} /> {t("subscriptions_mark_paid")}
                      </button>
                    )}
                    {s.status !== "cancelled" && (
                      <button
                        onClick={() => handleReminder(s)}
                        disabled={working === s.id}
                        className={`flex items-center gap-1 text-xs font-medium disabled:opacity-40 ${
                          days <= 1 ? "text-sky-600 dark:text-sky-400 font-semibold" : "text-ink/60 dark:text-white/60"
                        }`}
                      >
                        <MessageCircle size={13} /> {t("subscriptions_send_reminder")}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setProfileDraft(s.profile ?? "");
                        setEditProfileId(editProfileId === s.id ? null : s.id);
                      }}
                      disabled={working === s.id}
                      className="flex items-center gap-1 text-xs font-medium text-ink/60 dark:text-white/60 disabled:opacity-40"
                    >
                      <UserRound size={13} /> {t("subscriptions_profile_edit")}
                    </button>
                    {!unpaid && (
                      <button
                        onClick={() => {
                          setPaidDraft(lastPaidAt(s) ? toLocalInput(lastPaidAt(s)) : nowLocal());
                          setEditPaidId(editPaidId === s.id ? null : s.id);
                        }}
                        disabled={working === s.id}
                        className="flex items-center gap-1 text-xs font-medium text-ink/60 dark:text-white/60 disabled:opacity-40"
                      >
                        <CalendarClock size={13} /> {t("subscriptions_edit_paid_at")}
                      </button>
                    )}
                    {!unpaid && (
                      <button
                        onClick={() => handleUndoPay(s.id)}
                        disabled={working === s.id}
                        className="flex items-center gap-1 text-xs font-medium text-ink/60 dark:text-white/60 disabled:opacity-40"
                      >
                        <Undo2 size={13} /> {t("subscriptions_undo_pay")}
                      </button>
                    )}
                    {unpaid && (
                      <button
                        onClick={() => handleDelete(s.id)}
                        disabled={working === s.id}
                        className="flex items-center gap-1 text-xs font-medium text-brick disabled:opacity-40"
                      >
                        <Trash2 size={13} /> {t("subscriptions_delete")}
                      </button>
                    )}
                    {s.status !== "cancelled" && (
                      <button
                        onClick={() => handleCancel(s.id)}
                        disabled={working === s.id}
                        className="flex items-center gap-1 text-xs font-medium text-brick disabled:opacity-40"
                      >
                        <XCircle size={13} /> {t("subscriptions_cancel")}
                      </button>
                    )}
                  </div>
                </div>
                {editPhoneId === s.id && (
                  <div className="mt-3 pt-3 border-t border-ink/10 dark:border-dark-border flex items-end gap-2">
                    <label className="flex-1 block">
                      <span className="block text-xs font-medium text-ink/70 dark:text-white/70 mb-1">{t("subscriptions_customer_phone")}</span>
                      <input
                        type="tel"
                        inputMode="tel"
                        value={phoneDraft}
                        onChange={(e) => setPhoneDraft(e.target.value)}
                        className={inputClass}
                        placeholder={t("subscriptions_phone_placeholder")}
                        maxLength={30}
                        autoFocus
                      />
                    </label>
                    <button
                      onClick={() => savePhoneAndSend(s)}
                      disabled={working === s.id || waNumber(phoneDraft).length < 8}
                      className="rounded-md bg-ink text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
                    >
                      {t("subscriptions_phone_save_send")}
                    </button>
                  </div>
                )}
                {editProfileId === s.id && (
                  <div className="mt-3 pt-3 border-t border-ink/10 dark:border-dark-border flex items-end gap-2">
                    <label className="flex-1 block">
                      <span className="block text-xs font-medium text-ink/70 dark:text-white/70 mb-1">{t("subscriptions_profile")}</span>
                      <input value={profileDraft} onChange={(e) => setProfileDraft(e.target.value)} className={inputClass} maxLength={60} autoFocus />
                    </label>
                    <button
                      onClick={() => saveProfile(s.id)}
                      disabled={working === s.id}
                      className="rounded-md bg-ink text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
                    >
                      {t("ub_price_save")}
                    </button>
                  </div>
                )}
                {editPaidId === s.id && (
                  <div className="mt-3 pt-3 border-t border-ink/10 dark:border-dark-border flex items-end gap-2">
                    <label className="flex-1 block">
                      <span className="block text-xs font-medium text-ink/70 dark:text-white/70 mb-1">{t("subscriptions_paid_at")}</span>
                      <input type="datetime-local" value={paidDraft} onChange={(e) => setPaidDraft(e.target.value)} className={inputClass} />
                    </label>
                    <button
                      onClick={() => savePaidAt(s.id)}
                      disabled={working === s.id || !paidDraft}
                      className="rounded-md bg-ink text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
                    >
                      {t("ub_price_save")}
                    </button>
                  </div>
                )}
                {payingId === s.id && (
                  <div className="mt-3 pt-3 border-t border-ink/10 dark:border-dark-border flex items-end gap-2">
                    <label className="flex-1 block">
                      <span className="block text-xs font-medium text-ink/70 dark:text-white/70 mb-1">{t("subscriptions_paid_at")}</span>
                      <input type="datetime-local" value={payAt} onChange={(e) => setPayAt(e.target.value)} className={inputClass} />
                    </label>
                    <button
                      onClick={() => handleMarkPaid(s.id)}
                      disabled={working === s.id || !payAt}
                      className="rounded-md bg-forest text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
                    >
                      {t("subscriptions_confirm_pay")}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
