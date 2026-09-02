"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Loader2, Receipt } from "lucide-react";
import { BusinessSwitcher } from "@/components/dashboard/business-switcher";
import type { Business, Expense } from "@/types";

const CATEGORIES: { key: Expense["category"]; label: string }[] = [
  { key: "salaires", label: "Salè" },
  { key: "transport", label: "Transpò" },
  { key: "loyer", label: "Lwaye" },
  { key: "electricite", label: "Elektrisite" },
  { key: "internet", label: "Entènèt" },
  { key: "divers", label: "Divès" },
];

function fmt(n: number) {
  return `${n.toLocaleString("fr-FR")} G`;
}

export default function ExpensesPage() {
  const [businesses, setBusinesses] = useState<Business[] | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState<Expense["category"]>("divers");
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const res = await fetch(`/api/expenses?businessId=${businessId}`);
      const data = await res.json();
      setExpenses((data.expenses ?? []).filter(Boolean));
      setTotal(data.total ?? 0);
    } catch {
      setError("Pa ka chaje depans yo.");
    }
    setLoading(false);
  }, [businessId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!businessId || amount <= 0) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, category, amount, note: note || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Pa ka anrejistre depans lan.");
        setSaving(false);
        return;
      }
      setShowForm(false);
      setAmount(0);
      setNote("");
      await load();
    } catch {
      setError("Erè rezo — eseye ankò.");
    }
    setSaving(false);
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
        <Receipt size={28} className="mx-auto mb-3 text-ink/30" />
        <p className="text-sm text-ink/60 dark:text-paper/60">
          Kreye yon antrepriz anvan pou anrejistre depans.
        </p>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 lg:px-8 py-8 pb-24">
      <div className="flex items-start justify-between mb-4">
        <h1 className="font-display text-xl lg:text-2xl">Depans</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 bg-brick text-paper rounded-full px-4 py-2.5 text-sm font-medium"
        >
          <Plus size={16} /> Ajoute depans
        </button>
      </div>

      <BusinessSwitcher
        businesses={businesses.map((b) => ({ id: b.id, name: b.name, icon: b.icon }))}
        activeId={businessId ?? ""}
        onSelect={setBusinessId}
        showOverviewTab={false}
      />

      <div className="rounded-card p-5 my-5 bg-ink dark:bg-dark-surface text-paper">
        <p className="text-xs uppercase tracking-wide text-paper/50 mb-1">Total depans jodi a</p>
        <p className="font-display text-2xl">{fmt(total)}</p>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-card border border-ink/10 dark:border-dark-border bg-white dark:bg-dark-surface p-5 mb-5 space-y-4"
        >
          <label className="block">
            <span className="block text-xs font-medium text-ink/70 dark:text-paper/70 mb-1">
              Kategori
            </span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Expense["category"])}
              className="w-full border border-ink/15 dark:border-dark-border bg-white dark:bg-dark-surface rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30"
            >
              {CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-ink/70 dark:text-paper/70 mb-1">
              Montan (G)
            </span>
            <input
              type="number"
              min={1}
              value={amount || ""}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full border border-ink/15 dark:border-dark-border bg-white dark:bg-dark-surface rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30"
              required
            />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-ink/70 dark:text-paper/70 mb-1">
              Nòt (opsyonèl)
            </span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full border border-ink/15 dark:border-dark-border bg-white dark:bg-dark-surface rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30"
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-ink text-paper rounded-full py-2.5 text-sm font-medium disabled:opacity-50"
          >
            {saving ? "Ap anrejistre..." : "Anrejistre depans lan"}
          </button>
          {error && <p className="text-sm text-brick text-center">{error}</p>}
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-10 text-ink/40 dark:text-paper/40">
          <Loader2 size={20} className="animate-spin" />
        </div>
      ) : expenses.length === 0 ? (
        <p className="text-sm text-center text-ink/40 dark:text-paper/40 py-10">
          Poko gen depans jodi a.
        </p>
      ) : (
        <div className="rounded-card border border-ink/10 dark:border-dark-border bg-white dark:bg-dark-surface overflow-hidden">
          {expenses.map((e, i) => (
            <div
              key={e.id}
              className={`flex items-center justify-between px-4 py-3 text-sm ${
                i > 0 ? "border-t border-ink/8 dark:border-dark-border/60" : ""
              }`}
            >
              <span>
                {CATEGORIES.find((c) => c.key === e.category)?.label ?? e.category}
                {e.note && <span className="block text-xs text-ink/40 dark:text-paper/40">{e.note}</span>}
              </span>
              <span className="stat-figure font-medium">{fmt(e.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
