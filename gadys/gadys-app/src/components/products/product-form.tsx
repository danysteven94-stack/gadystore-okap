"use client";

import { useState } from "react";
import { X, Trash2 } from "lucide-react";

export interface ProductFormValues {
  id?: string;
  name: string;
  category: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
  barcode?: string;
}

interface Props {
  initial?: ProductFormValues;
  onSave: (values: ProductFormValues) => void;
  onDelete?: () => void;
  onClose: () => void;
}

const EMPTY: ProductFormValues = {
  name: "",
  category: "",
  buyPrice: 0,
  sellPrice: 0,
  stock: 0,
  minStock: 5,
  barcode: "",
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block mb-3">
      <span className="block text-xs font-medium text-ink/70 dark:text-paper/70 mb-1">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full border border-ink/15 dark:border-dark-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30";

export function ProductForm({ initial, onSave, onDelete, onClose }: Props) {
  const [values, setValues] = useState<ProductFormValues>(initial ?? EMPTY);
  const isEditing = !!initial?.id;

  function update<K extends keyof ProductFormValues>(
    key: K,
    value: ProductFormValues[K]
  ) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.name.trim() || !values.category.trim()) return;
    onSave(values);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
      <div className="w-full sm:max-w-sm bg-paper dark:bg-dark-bg rounded-t-2xl sm:rounded-card max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink/10 dark:border-dark-border sticky top-0 bg-paper dark:bg-dark-bg">
          <h2 className="font-display text-lg">
            {isEditing ? "Modifye pwodwi" : "Ajoute pwodwi"}
          </h2>
          <button onClick={onClose} aria-label="Fèmen">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4">
          <Field label="Non pwodwi">
            <input
              className={inputClass}
              value={values.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Ekz: Sak diri 25lb"
              required
            />
          </Field>

          <Field label="Kategori">
            <input
              className={inputClass}
              value={values.category}
              onChange={(e) => update("category", e.target.value)}
              placeholder="Ekz: Grenn / Céréales"
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Pri Achte (G)">
              <input
                type="number"
                min={0}
                className={inputClass}
                value={values.buyPrice}
                onChange={(e) => update("buyPrice", Number(e.target.value))}
              />
            </Field>
            <Field label="Pri Vann (G)">
              <input
                type="number"
                min={0}
                className={inputClass}
                value={values.sellPrice}
                onChange={(e) => update("sellPrice", Number(e.target.value))}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Stok aktyèl">
              <input
                type="number"
                min={0}
                className={inputClass}
                value={values.stock}
                onChange={(e) => update("stock", Number(e.target.value))}
              />
            </Field>
            <Field label="Stok minimòm">
              <input
                type="number"
                min={0}
                className={inputClass}
                value={values.minStock}
                onChange={(e) => update("minStock", Number(e.target.value))}
              />
            </Field>
          </div>

          <Field label="Kòd-baf (opsyonèl)">
            <input
              className={inputClass}
              value={values.barcode}
              onChange={(e) => update("barcode", e.target.value)}
              placeholder="Ekz: 0001"
            />
          </Field>

          <div className="flex gap-2 mt-5 pb-2">
            {isEditing && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                aria-label="Efase pwodwi"
                className="w-11 h-11 shrink-0 rounded-full border border-brick/30 text-brick flex items-center justify-center"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button
              type="submit"
              className="flex-1 bg-ink text-paper rounded-full py-2.5 text-sm font-medium"
            >
              {isEditing ? "Anrejistre chanjman" : "Ajoute pwodwi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
