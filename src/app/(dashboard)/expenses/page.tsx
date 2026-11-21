"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Loader2, Receipt, Pencil, Trash2 } from "lucide-react";
import { BusinessSwitcher } from "@/components/dashboard/business-switcher";
import { useLanguage } from "@/lib/i18n/language-provider";
import { useRole } from "@/lib/use-role";
import { can } from "@/lib/permissions";
import type { Business, Expense } from "@/types";

function fmt(n: number) {
  return `${Number(n).toLocaleString("fr-FR")} G`;
}

const todayStr = () => new Date().toISOString().slice(0, 10);

const inputCls =
  "w-full border border-ink/15 dark:border-dark-border bg-white dark:bg-dark-surface rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brick/30";

export default function ExpensesPage() {
  const { t } = useLanguage();
  const role = useRole();
  // Sèvè a aplike règ la tou; sa a se sèlman pou kache bouton yo.
  const canManage = role !== null && can(role, "products:write");

  const CATEGORIES: { key: Expense["category"]; label: string }[] = [
    { key: "achat", label: t("expenses_cat_achat") },
    { key: "salaires", label: t("expenses_cat_salaires") },
    { key: "transport", label: t("expenses_cat_transport") },
    { key: "loyer", label: t("expenses_cat_loyer") },
    { key: "electricite", label: t("expenses_cat_electricite") },
    { key: "internet", label: t("expenses_cat_internet") },
    { key: "divers", label: t("expenses_cat_divers") },
  ];
  const [businesses, setBusinesses] = useState<Business[] | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [date, setDate] = useState(todayStr());
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [category, setCategory] = useState<Expense["category"]>("divers");
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState("");
  const [source, setSource] = useState<"cash" | "bank">("cash");
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
      const res = await fetch(`/api/expenses?businessId=${businessId}&date=${date}`);
      const data = await res.json();
      setExpenses((data.expenses ?? []).filter(Boolean));
      setTotal(data.total ?? 0);
    } catch {
      setError("Pa ka chaje depans yo.");
    }
    setLoading(false);
  }, [businessId, date]);

  useEffect(() => {
    load();
  }, [load]);

  function resetForm() {
    setShowForm(false);
    setEditingId(null);
    setCategory("divers");
    setAmount(0);
    setNote("");
    setSource("cash");
    setError(null);
  }

  function startEdit(e: Expense) {
    setEditingId(e.id);
    setCategory(e.category);
    setAmount(Number(e.amount));
    setNote(e.note ?? "");
    setSource(e.source === "bank" ? "bank" : "cash");
    setError(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(e: Expense) {
    if (!window.confirm(t("expenses_delete_confirm"))) return;
    setError(null);
    try {
      const res = await fetch(`/api/expenses/${e.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(typeof data.error === "string" ? data.error : "Pa ka efase depans lan.");
        return;
      }
      if (editingId === e.id) resetForm();
      await load();
    } catch {
      setError("Erè rezo — eseye ankò.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!businessId || amount <= 0) return;
    setSaving(true);
    setError(null);
    try {
      const res = editingId
        ? await fetch(`/api/expenses/${editingId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            // note: "" → sèvè a retire nòt la
            body: JSON.stringify({ category, amount, note, source }),
          })
        : await fetch("/api/expenses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ businessId, category, amount, note: note || undefined, source }),
          });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(typeof data.error === "string" ? data.error : "Pa ka anrejistre depans lan.");
        setSaving(false);
        return;
      }
      // Yon nouvo depans toujou ale nan jodi a: si w t ap gade yon lòt jou, retounen sou jodi a.
      const wasEditing = !!editingId;
      resetForm();
      if (!wasEditing && date !== todayStr()) setDate(todayStr());
      else await load();
    } catch {
      setError("Erè rezo — eseye ankò.");
    }
    setSaving(false);
  }

  if (businesses === null) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 flex flex-col items-center text-ink/40 dark:text-white/40">
        <Loader2 size={24} className="animate-spin mb-2" />
        <p className="text-sm">Ap chaje...</p>
      </main>
    );
  }

  if (businesses.length === 0) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 text-center">
        <Receipt size={28} className="mx-auto mb-3 text-ink/30" />
        <p className="text-sm text-ink/60 dark:text-white/60">
          {t("expenses_need_business")}
        </p>
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
        <p className="text-sm text-center text-ink/40 dark:text-white/40 py-10">
          {t("choose_business_prompt")}
        </p>
      </main>
    );
  }

  const isToday = date === todayStr();

  return (
    <main className="max-w-3xl mx-auto px-4 lg:px-8 py-8 pb-24">
      <div className="flex items-start justify-between mb-4">
        <h1 className="font-display font-semibold text-xl lg:text-2xl">{t("expenses_title")}</h1>
        <button
          onClick={() => (showForm && !editingId ? resetForm() : (resetForm(), setShowForm(true)))}
          className="inline-flex items-center gap-2 bg-brick hover:bg-brick-dark text-white rounded-md px-4 py-2.5 text-sm font-medium"
        >
          <Plus size={16} /> {t("expenses_add")}
        </button>
      </div>

      <BusinessSwitcher
        businesses={businesses.map((b) => ({ id: b.id, name: b.name, icon: b.icon }))}
        activeId={businessId ?? ""}
        onSelect={(id) => {
          resetForm();
          setBusinessId(id);
        }}
        showOverviewTab={false}
      />

      <div className="rounded-card p-5 my-5 bg-ink dark:bg-dark-surface text-paper">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-white/50 mb-1">
              {isToday ? t("expenses_total_today") : t("expenses_total_day")}
            </p>
            <p className="font-display font-semibold text-2xl">{fmt(total)}</p>
          </div>
          <label className="text-xs text-white/60">
            <span className="block mb-1">{t("expenses_date")}</span>
            <input
              type="date"
              value={date}
              max={todayStr()}
              onChange={(e) => e.target.value && setDate(e.target.value)}
              className="bg-white/10 border border-white/20 rounded px-2 py-1 text-sm text-white [color-scheme:dark]"
            />
          </label>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-card border border-ink/10 dark:border-dark-border bg-white dark:bg-dark-surface p-5 mb-5 space-y-4"
        >
          {editingId && (
            <p className="text-sm font-semibold">{t("expenses_edit_title")}</p>
          )}
          <label className="block">
            <span className="block text-xs font-medium text-ink/70 dark:text-white/70 mb-1">
              {t("expenses_category")}
            </span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Expense["category"])}
              className={inputCls}
            >
              {CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-ink/70 dark:text-white/70 mb-1">
              {t("expenses_amount")}
            </span>
            <input
              type="number"
              min={1}
              value={amount || ""}
              onChange={(e) => setAmount(Number(e.target.value))}
              className={inputCls}
              required
            />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-ink/70 dark:text-white/70 mb-1">
              {t("expenses_source")}
            </span>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as "cash" | "bank")}
              className={inputCls}
            >
              <option value="cash">{t("expenses_source_cash")}</option>
              <option value="bank">{t("expenses_source_bank")}</option>
            </select>
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-ink/70 dark:text-white/70 mb-1">
              {t("expenses_note")}
            </span>
            <input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} />
          </label>
          <div className="flex gap-2">
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 border border-ink/15 dark:border-dark-border rounded-md py-2.5 text-sm font-medium"
              >
                {t("expenses_cancel")}
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-brick hover:bg-brick-dark text-white rounded-md py-2.5 text-sm font-medium disabled:opacity-50"
            >
              {saving ? t("expenses_saving") : editingId ? t("expenses_update") : t("expenses_submit")}
            </button>
          </div>
        </form>
      )}

      {error && !showForm && <p className="text-sm text-brick text-center mb-3">{error}</p>}
      {error && showForm && <p className="text-sm text-brick text-center mb-3">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-10 text-ink/40 dark:text-white/40">
          <Loader2 size={20} className="animate-spin" />
        </div>
      ) : expenses.length === 0 ? (
        <p className="text-sm text-center text-ink/40 dark:text-white/40 py-10">
          {t("expenses_empty")}
        </p>
      ) : (
        <div className="rounded-card border border-ink/10 dark:border-dark-border bg-white dark:bg-dark-surface overflow-hidden">
          {expenses.map((e, i) => (
            <div
              key={e.id}
              className={`flex items-center justify-between gap-3 px-4 py-3 text-sm ${
                i > 0 ? "border-t border-ink/8 dark:border-dark-border/60" : ""
              }`}
            >
              <span className="min-w-0">
                {CATEGORIES.find((c) => c.key === e.category)?.label ?? e.category}
                <span className="ml-2 text-[11px] rounded-full bg-mist dark:bg-white/10 px-2 py-0.5 text-ink/60 dark:text-white/60">
                  {e.source === "bank" ? t("expenses_source_bank") : t("expenses_source_cash")}
                </span>
                {e.note && <span className="block text-xs text-ink/40 dark:text-white/40 truncate">{e.note}</span>}
              </span>
              <span className="flex items-center gap-1 shrink-0">
                <span className="stat-figure font-medium mr-1">{fmt(e.amount)}</span>
                {canManage && (
                  <>
                    <button
                      type="button"
                      onClick={() => startEdit(e)}
                      aria-label={t("expenses_edit")}
                      title={t("expenses_edit")}
                      className="p-1.5 rounded hover:bg-mist dark:hover:bg-white/10 text-ink/60 dark:text-white/60"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(e)}
                      aria-label={t("expenses_delete")}
                      title={t("expenses_delete")}
                      className="p-1.5 rounded hover:bg-brick/10 text-brick"
                    >
                      <Trash2 size={15} />
                    </button>
                  </>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
