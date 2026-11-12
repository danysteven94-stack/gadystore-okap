"use client";

import { useRef, useState } from "react";
import { X, Trash2, ImagePlus, Loader2 } from "lucide-react";
import { uploadProductImage } from "@/lib/compress-image";
import { useLanguage } from "@/lib/i18n/language-provider";

export interface ProductFormValues {
  id?: string;
  name: string;
  category: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
  barcode?: string;
  imageUrl?: string;
  published?: boolean;
  unit?: string;
  description?: string;
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
  imageUrl: "",
  published: false,
  unit: "",
  description: "",
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
      <span className="block text-xs font-medium text-ink/70 dark:text-white/70 mb-1">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full border border-ink/15 dark:border-dark-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brick/30";

export function ProductForm({ initial, onSave, onDelete, onClose }: Props) {
  const { t } = useLanguage();
  const [values, setValues] = useState<ProductFormValues>(initial ?? EMPTY);
  const isEditing = !!initial?.id;
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const url = await uploadProductImage(file);
      setValues((v) => ({ ...v, imageUrl: url }));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Pa ka voye foto a.");
    }
    setUploading(false);
  }

  function update<K extends keyof ProductFormValues>(
    key: K,
    value: ProductFormValues[K]
  ) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.name.trim() || !values.category.trim() || uploading) return;
    onSave({
      ...values,
      imageUrl: values.imageUrl || undefined,
      published: values.published === true || (values.published as unknown) === "true",
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
      <div className="w-full sm:max-w-sm bg-paper dark:bg-dark-bg rounded-t-2xl sm:rounded-card max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink/10 dark:border-dark-border sticky top-0 bg-paper dark:bg-dark-bg">
          <h2 className="font-display font-semibold text-lg">
            {isEditing ? t("products_edit") : t("products_add")}
          </h2>
          <button onClick={onClose} aria-label={t("common_close")}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4">
          <Field label={t("product_form_photo")}>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-24 h-24 shrink-0 rounded-card border border-dashed border-ink/25 dark:border-dark-border overflow-hidden flex flex-col items-center justify-center gap-1 text-ink/50 bg-white dark:bg-dark-surface"
              >
                {uploading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : values.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={values.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <ImagePlus size={22} />
                    <span className="text-[10px]">{t("product_form_photo_add")}</span>
                  </>
                )}
              </button>
              <div className="text-xs space-y-1">
                {uploading && <p className="text-ink/60 dark:text-white/60">{t("product_form_photo_uploading")}</p>}
                {values.imageUrl && !uploading && (
                  <>
                    <button type="button" onClick={() => fileRef.current?.click()} className="block font-medium text-forest underline underline-offset-2">
                      {t("product_form_photo_change")}
                    </button>
                    <button type="button" onClick={() => update("imageUrl", "")} className="block text-brick underline underline-offset-2">
                      {t("product_form_photo_remove")}
                    </button>
                  </>
                )}
                {uploadError && <p className="text-brick">{uploadError}</p>}
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
            </div>
          </Field>

          <Field label={t("product_form_name")}>
            <input
              className={inputClass}
              value={values.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Ekz: Sak diri 25lb"
              required
            />
          </Field>

          <Field label={t("product_form_category")}>
            <input
              className={inputClass}
              value={values.category}
              onChange={(e) => update("category", e.target.value)}
              placeholder="Ekz: Grenn / Céréales"
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t("product_form_buy_price")}>
              <input
                type="number"
                min={0}
                className={inputClass}
                value={values.buyPrice}
                onChange={(e) => update("buyPrice", Number(e.target.value))}
              />
            </Field>
            <Field label={t("product_form_sell_price")}>
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
            <Field label={t("product_form_stock")}>
              <input
                type="number"
                min={0}
                className={inputClass}
                value={values.stock}
                onChange={(e) => update("stock", Number(e.target.value))}
              />
            </Field>
            <Field label={t("product_form_min_stock")}>
              <input
                type="number"
                min={0}
                className={inputClass}
                value={values.minStock}
                onChange={(e) => update("minStock", Number(e.target.value))}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t("product_form_unit")}>
              <input
                className={inputClass}
                value={values.unit ?? ""}
                onChange={(e) => update("unit", e.target.value)}
                placeholder="Ekz: Caisse"
              />
            </Field>
            <Field label={t("product_form_barcode")}>
              <input
                className={inputClass}
                value={values.barcode}
                onChange={(e) => update("barcode", e.target.value)}
                placeholder="Ekz: 0001"
              />
            </Field>
          </div>

          <Field label={t("product_form_description")}>
            <textarea
              className={inputClass}
              rows={2}
              maxLength={500}
              value={values.description ?? ""}
              onChange={(e) => update("description", e.target.value)}
            />
          </Field>

          <label className="flex items-start gap-3 rounded-card border border-ink/20 bg-forest/5 px-3 py-3 mb-3 cursor-pointer">
            <input
              type="checkbox"
              checked={values.published === true || (values.published as unknown) === "true"}
              onChange={(e) => update("published", e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-emerald-600"
            />
            <span>
              <span className="block text-sm font-medium">{t("product_form_published")}</span>
              <span className="block text-xs text-ink/60 dark:text-white/60">{t("product_form_published_hint")}</span>
            </span>
          </label>

          <div className="flex gap-2 mt-5 pb-2">
            {isEditing && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                aria-label={t("common_delete")}
                className="w-11 h-11 shrink-0 rounded-full border border-brick/30 text-brick flex items-center justify-center"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button
              type="submit"
              className="flex-1 bg-ink text-paper rounded-md py-2.5 text-sm font-medium"
            >
              {isEditing ? t("common_save") : t("products_add")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
