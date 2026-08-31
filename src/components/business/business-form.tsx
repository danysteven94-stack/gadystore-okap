"use client";

import { useState } from "react";
import { X, Warehouse, Ship, Cake, Smartphone, MonitorPlay, Store, Trash2 } from "lucide-react";

export interface BusinessFormValues {
  id?: string;
  name: string;
  icon: string;
  currency: string;
  taxRate: number;
  tags: string[];
}

interface Props {
  initial?: BusinessFormValues;
  onSave: (values: BusinessFormValues) => void;
  onDelete?: () => void;
  onClose: () => void;
  saving?: boolean;
}

const ICON_OPTIONS: { key: string; label: string; Icon: React.ElementType }[] = [
  { key: "warehouse", label: "Gwo & Detay", Icon: Warehouse },
  { key: "ship", label: "Enpòtasyon", Icon: Ship },
  { key: "cake", label: "Manje/Patisri", Icon: Cake },
  { key: "smartphone", label: "Elektwonik", Icon: Smartphone },
  { key: "streaming", label: "Streaming", Icon: MonitorPlay },
  { key: "store", label: "Lòt", Icon: Store },
];

const inputClass =
  "w-full border border-ink/15 dark:border-dark-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30 bg-white dark:bg-dark-surface";

const EMPTY: BusinessFormValues = { name: "", icon: "store", currency: "HTG", taxRate: 0, tags: [] };

export function BusinessForm({ initial, onSave, onDelete, onClose, saving }: Props) {
  const [values, setValues] = useState<BusinessFormValues>(initial ?? EMPTY);
  const [tagsInput, setTagsInput] = useState((initial?.tags ?? []).join(", "));
  const isEditing = !!initial?.id;

  function update<K extends keyof BusinessFormValues>(key: K, value: BusinessFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.name.trim()) return;
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    onSave({ ...values, name: values.name.trim(), tags });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
      <div className="w-full sm:max-w-sm bg-paper dark:bg-dark-bg rounded-t-2xl sm:rounded-card max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink/10 dark:border-dark-border sticky top-0 bg-paper dark:bg-dark-bg">
          <h2 className="font-display text-lg">
            {isEditing ? "Modifye antrepriz" : "Ajoute yon antrepriz"}
          </h2>
          <button onClick={onClose} aria-label="Fèmen">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4">
          <label className="block mb-3">
            <span className="block text-xs font-medium text-ink/70 dark:text-paper/70 mb-1">
              Non antrepriz
            </span>
            <input
              className={inputClass}
              value={values.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Ekz: Gady's Boutik"
              required
              autoFocus
            />
          </label>

          <span className="block text-xs font-medium text-ink/70 dark:text-paper/70 mb-2">
            Kalite biznis
          </span>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {ICON_OPTIONS.map(({ key, label, Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => update("icon", key)}
                className={`flex flex-col items-center gap-1 rounded-card border p-3 text-[11px] ${
                  values.icon === key
                    ? "border-forest bg-forest/5 dark:bg-forest/20"
                    : "border-ink/10 dark:border-dark-border"
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </div>

          <label className="block mb-4">
            <span className="block text-xs font-medium text-ink/70 dark:text-paper/70 mb-1">
              Tags (separe ak vigil ,)
            </span>
            <input
              className={inputClass}
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Ekz: Menus, Kòmand, Rezèvasyon"
            />
          </label>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <label className="block">
              <span className="block text-xs font-medium text-ink/70 dark:text-paper/70 mb-1">
                Monnen
              </span>
              <select
                className={inputClass}
                value={values.currency}
                onChange={(e) => update("currency", e.target.value)}
              >
                <option value="HTG">Goud (HTG)</option>
                <option value="USD">Dola (USD)</option>
              </select>
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-ink/70 dark:text-paper/70 mb-1">
                Taks (%)
              </span>
              <input
                type="number"
                min={0}
                className={inputClass}
                value={values.taxRate}
                onChange={(e) => update("taxRate", Number(e.target.value))}
              />
            </label>
          </div>

          <div className="flex gap-2">
            {isEditing && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                aria-label="Efase antrepriz"
                className="w-11 h-11 shrink-0 rounded-full border border-brick/30 text-brick flex items-center justify-center"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-ink text-paper rounded-full py-2.5 text-sm font-medium disabled:opacity-50"
            >
              {saving ? "Ap anrejistre..." : isEditing ? "Anrejistre chanjman" : "Kreye antrepriz la"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
