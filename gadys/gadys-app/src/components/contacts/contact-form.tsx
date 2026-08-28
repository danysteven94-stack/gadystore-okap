"use client";

import { useState } from "react";
import { X, Trash2 } from "lucide-react";

export interface ContactFormValues {
  id?: string;
  name: string;
  phone: string;
  email: string;
  address: string;
}

interface Props {
  kind: "customer" | "supplier";
  initial?: ContactFormValues;
  onSave: (values: ContactFormValues) => void;
  onDelete?: () => void;
  onClose: () => void;
}

const EMPTY: ContactFormValues = { name: "", phone: "", email: "", address: "" };

const inputClass =
  "w-full border border-ink/15 dark:border-dark-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block mb-3">
      <span className="block text-xs font-medium text-ink/70 dark:text-paper/70 mb-1">{label}</span>
      {children}
    </label>
  );
}

export function ContactForm({ kind, initial, onSave, onDelete, onClose }: Props) {
  const [values, setValues] = useState<ContactFormValues>(initial ?? EMPTY);
  const isEditing = !!initial?.id;
  const title =
    kind === "customer"
      ? isEditing
        ? "Modifye kliyan"
        : "Ajoute kliyan"
      : isEditing
      ? "Modifye founisè"
      : "Ajoute founisè";

  function update<K extends keyof ContactFormValues>(key: K, value: ContactFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.name.trim()) return;
    onSave(values);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
      <div className="w-full sm:max-w-sm bg-paper dark:bg-dark-bg rounded-t-2xl sm:rounded-card max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink/10 dark:border-dark-border sticky top-0 bg-paper dark:bg-dark-bg">
          <h2 className="font-display text-lg">{title}</h2>
          <button onClick={onClose} aria-label="Fèmen">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4">
          <Field label="Non">
            <input
              className={inputClass}
              value={values.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder={kind === "customer" ? "Non kliyan an" : "Non founisè a"}
              required
            />
          </Field>
          <Field label="Telefòn">
            <input
              className={inputClass}
              value={values.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="Ekz: 3712-3456"
            />
          </Field>
          <Field label="Imèl (opsyonèl)">
            <input
              type="email"
              className={inputClass}
              value={values.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </Field>
          <Field label="Adrès (opsyonèl)">
            <input
              className={inputClass}
              value={values.address}
              onChange={(e) => update("address", e.target.value)}
            />
          </Field>

          <div className="flex gap-2 mt-5 pb-2">
            {isEditing && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                aria-label="Efase"
                className="w-11 h-11 shrink-0 rounded-full border border-brick/30 text-brick flex items-center justify-center"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button
              type="submit"
              className="flex-1 bg-ink text-paper rounded-full py-2.5 text-sm font-medium"
            >
              {isEditing ? "Anrejistre chanjman" : "Ajoute"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
