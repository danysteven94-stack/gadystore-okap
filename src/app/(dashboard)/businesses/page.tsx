"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Loader2, Building2 } from "lucide-react";
import {
  Warehouse,
  Ship,
  Cake,
  Smartphone,
  MonitorPlay,
  Store,
} from "lucide-react";
import { BusinessForm, type BusinessFormValues } from "@/components/business/business-form";
import type { Business } from "@/types";

const ICONS: Record<string, React.ElementType> = {
  warehouse: Warehouse,
  ship: Ship,
  cake: Cake,
  smartphone: Smartphone,
  streaming: MonitorPlay,
  store: Store,
};

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[] | null>(null);
  const [formTarget, setFormTarget] = useState<"new" | Business | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/businesses");
      const data = await res.json();
      setBusinesses(data.businesses ?? []);
    } catch {
      setBusinesses([]);
      setError("Pa ka chaje antrepriz yo.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSave(values: BusinessFormValues) {
    setSaving(true);
    setError(null);
    try {
      if (values.id) {
        const res = await fetch(`/api/businesses/${values.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        if (!res.ok) throw new Error();
      } else {
        const res = await fetch("/api/businesses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Pa ka kreye antrepriz la.");
          setSaving(false);
          return;
        }
      }
      setFormTarget(null);
      setSaving(false);
      await load();
    } catch {
      setError("Erè rezo — eseye ankò.");
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (formTarget && formTarget !== "new") {
      try {
        await fetch(`/api/businesses/${formTarget.id}`, { method: "DELETE" });
      } catch {
        setError("Pa ka efase antrepriz la.");
      }
    }
    setFormTarget(null);
    await load();
  }

  return (
    <main className="max-w-5xl mx-auto px-4 lg:px-8 py-8">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="font-display text-2xl mb-1">Antrepriz</h1>
          <p className="text-sm text-ink/60 dark:text-paper/60">
            Tout antrepriz ou yo, jere apati yon sèl kont.
          </p>
        </div>
        <button
          onClick={() => setFormTarget("new")}
          className="inline-flex items-center gap-2 bg-forest text-paper rounded-full px-4 py-2.5 text-sm font-medium shrink-0"
        >
          <Plus size={16} /> Nouvo antrepriz
        </button>
      </div>

      {error && <p className="text-sm text-brick mt-4">{error}</p>}

      {businesses === null ? (
        <div className="flex justify-center py-16 text-ink/40 dark:text-paper/40">
          <Loader2 size={24} className="animate-spin" />
        </div>
      ) : businesses.length === 0 ? (
        <div className="text-center py-16 text-ink/40 dark:text-paper/40">
          <Building2 size={28} className="mx-auto mb-2" />
          <p className="text-sm">Ou poko gen antrepriz. Kreye premye a.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {businesses.map((b) => {
            const Icon = ICONS[b.icon] ?? Store;
            return (
              <div
                key={b.id}
                className="rounded-card border border-ink/10 dark:border-dark-border bg-white dark:bg-dark-surface p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl bg-brick/10 flex items-center justify-center text-brick">
                    <Icon size={20} />
                  </div>
                  <button
                    onClick={() => setFormTarget(b)}
                    aria-label={`Modifye ${b.name}`}
                    className="text-ink/40 dark:text-paper/40 hover:text-ink dark:hover:text-paper"
                  >
                    <Pencil size={15} />
                  </button>
                </div>
                <p className="font-display text-base mb-0.5">{b.name}</p>
                <p className="text-[11px] uppercase tracking-wide text-ink/40 dark:text-paper/40 mb-3">
                  {b.currency} · {b.taxRate}% taks
                </p>
                {b.tags && b.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {b.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[11px] bg-ink/5 dark:bg-paper/10 text-ink/70 dark:text-paper/70 rounded-full px-2.5 py-1"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {formTarget && (
        <BusinessForm
          initial={
            formTarget === "new"
              ? undefined
              : {
                  id: formTarget.id,
                  name: formTarget.name,
                  icon: formTarget.icon,
                  currency: formTarget.currency,
                  taxRate: formTarget.taxRate,
                  tags: formTarget.tags ?? [],
                }
          }
          onSave={handleSave}
          onDelete={formTarget !== "new" ? handleDelete : undefined}
          onClose={() => setFormTarget(null)}
          saving={saving}
        />
      )}
    </main>
  );
}
