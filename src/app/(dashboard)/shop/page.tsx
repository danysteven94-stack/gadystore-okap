"use client";

import { useEffect, useState, useCallback } from "react";
import { Store, Loader2, Copy, ExternalLink, MessageCircle, Check } from "lucide-react";
import { BusinessSwitcher } from "@/components/dashboard/business-switcher";
import { useLanguage } from "@/lib/i18n/language-provider";
import type { Product } from "@/types";

interface ShopSettings {
  id: string;
  name: string;
  icon: string;
  slug: string;
  shopEnabled: boolean;
  whatsapp: string;
  shopTagline: string;
  shopPaymentInfo: string;
  productCount: number;
  publishedCount: number;
}

const inputClass =
  "w-full border border-ink/15 dark:border-dark-border bg-white dark:bg-dark-surface rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30";

const isOn = (v: unknown) => v === true || v === "true";

export default function ShopPage() {
  const { t } = useLanguage();
  const [shops, setShops] = useState<ShopSettings[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [form, setForm] = useState({ slug: "", whatsapp: "", shopTagline: "", shopPaymentInfo: "" });
  const [products, setProducts] = useState<Product[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const loadShops = useCallback(async () => {
    try {
      const res = await fetch("/api/shop/settings");
      const data = await res.json();
      setShops(data.shops ?? []);
    } catch {
      setShops([]);
    }
  }, []);

  useEffect(() => {
    loadShops();
  }, [loadShops]);

  const active = shops?.find((s) => s.id === activeId) ?? null;

  useEffect(() => {
    if (!active) return;
    setForm({
      slug: active.slug,
      whatsapp: active.whatsapp,
      shopTagline: active.shopTagline,
      shopPaymentInfo: active.shopPaymentInfo,
    });
    setMessage(null);
  }, [active?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadProducts = useCallback(async () => {
    if (!activeId) return;
    try {
      const res = await fetch(`/api/products?businessId=${activeId}`);
      const data = await res.json();
      setProducts((data.products ?? []).filter(Boolean));
    } catch {
      setProducts([]);
    }
  }, [activeId]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  async function patch(body: Record<string, unknown>) {
    if (!activeId) return null;
    const res = await fetch("/api/shop/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId: activeId, ...body }),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data };
  }

  async function toggleShop() {
    if (!active) return;
    const r = await patch({ shopEnabled: !active.shopEnabled });
    if (r?.ok) await loadShops();
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const r = await patch({
        slug: form.slug || undefined,
        whatsapp: form.whatsapp,
        shopTagline: form.shopTagline,
        shopPaymentInfo: form.shopPaymentInfo,
      });
      if (r?.ok) {
        setMessage({ ok: true, text: t("shop_saved") });
        await loadShops();
      } else {
        setMessage({ ok: false, text: r?.data?.error || "Erè." });
      }
    } catch {
      setMessage({ ok: false, text: "Erè rezo — eseye ankò." });
    }
    setSaving(false);
  }

  async function setPublished(p: Product, published: boolean) {
    setProducts((list) => list.map((x) => (x.id === p.id ? { ...x, published } : x)));
    try {
      await fetch(`/api/products/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published }),
      });
    } catch {
      /* rechaje pou resynchronize */
    }
    await Promise.all([loadProducts(), loadShops()]);
  }

  async function publishAll() {
    await Promise.all(products.filter((p) => !isOn(p.published)).map((p) => setPublished(p, true)));
  }

  // Si yon sèl antrepriz, chwazi l otomatikman
  useEffect(() => {
    if (shops && shops.length === 1 && !activeId) setActiveId(shops[0].id);
  }, [shops, activeId]);

  if (shops === null) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 flex flex-col items-center text-ink/40 dark:text-paper/40">
        <Loader2 size={24} className="animate-spin mb-2" />
        <p className="text-sm">Ap chaje...</p>
      </main>
    );
  }

  if (shops.length === 0) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 text-center">
        <Store size={28} className="mx-auto mb-3 text-ink/30" />
        <p className="text-sm text-ink/60 dark:text-paper/60">{t("shop_need_business")}</p>
      </main>
    );
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const link = active?.slug ? `${origin}/boutik/${active.slug}` : "";

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt(t("shop_link"), link);
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-4 lg:px-8 py-8 pb-24">
      <h1 className="font-display text-xl lg:text-2xl mb-1">{t("shop_title")}</h1>
      <p className="text-sm text-ink/60 dark:text-paper/60 mb-5">{t("shop_subtitle")}</p>

      <BusinessSwitcher
        businesses={shops.map((b) => ({ id: b.id, name: b.name, icon: b.icon }))}
        activeId={activeId ?? ""}
        onSelect={setActiveId}
        showOverviewTab={false}
      />

      {!active ? (
        <p className="text-sm text-center text-ink/40 dark:text-paper/40 py-10">{t("choose_business_prompt")}</p>
      ) : (
        <div className="mt-5 space-y-5">
          {/* Lyen + switch */}
          <div className="rounded-card border border-ink/10 dark:border-dark-border bg-white dark:bg-dark-surface p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium">{active.shopEnabled ? t("shop_enabled") : t("shop_disabled")}</p>
                <p className="text-xs text-ink/50 dark:text-paper/50">
                  {active.publishedCount}/{active.productCount} {t("nav_products").toLowerCase()}
                </p>
              </div>
              <button
                onClick={toggleShop}
                role="switch"
                aria-checked={active.shopEnabled}
                className={`w-12 h-7 rounded-full p-1 transition-colors ${active.shopEnabled ? "bg-forest" : "bg-ink/20"}`}
              >
                <span className={`block w-5 h-5 rounded-full bg-white transition-transform ${active.shopEnabled ? "translate-x-5" : ""}`} />
              </button>
            </div>

            {active.slug ? (
              <>
                <p className="text-xs text-ink/50 dark:text-paper/50 mb-1">{t("shop_link")}</p>
                <p className="stat-figure text-sm break-all rounded bg-ink/5 dark:bg-white/5 px-3 py-2 mb-3">{link}</p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={copyLink} className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 dark:border-dark-border px-3.5 py-2 text-xs font-medium">
                    {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? t("shop_copied") : t("shop_copy")}
                  </button>
                  <a href={link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 dark:border-dark-border px-3.5 py-2 text-xs font-medium">
                    <ExternalLink size={14} /> {t("shop_open")}
                  </a>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`${active.name} — ${link}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-forest text-paper px-3.5 py-2 text-xs font-medium"
                  >
                    <MessageCircle size={14} /> {t("shop_share_whatsapp")}
                  </a>
                </div>
              </>
            ) : (
              <p className="text-xs text-ink/60 dark:text-paper/60">
                Pouse switch la pou kreye lyen boutik la epi anrejistre paramèt yo.
              </p>
            )}
          </div>

          {/* Paramèt */}
          <form onSubmit={saveSettings} className="rounded-card border border-ink/10 dark:border-dark-border bg-white dark:bg-dark-surface p-5 space-y-4">
            <label className="block">
              <span className="block text-xs font-medium text-ink/70 dark:text-paper/70 mb-1">{t("shop_slug_label")}</span>
              <div className="flex items-center gap-1 text-sm">
                <span className="text-ink/40 shrink-0">/boutik/</span>
                <input className={inputClass} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="non-biznis-ou" />
              </div>
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-ink/70 dark:text-paper/70 mb-1">{t("shop_whatsapp_label")}</span>
              <input className={inputClass} inputMode="tel" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="50937001234" />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-ink/70 dark:text-paper/70 mb-1">{t("shop_tagline_label")}</span>
              <input className={inputClass} maxLength={60} value={form.shopTagline} onChange={(e) => setForm({ ...form, shopTagline: e.target.value })} placeholder="Katalòg & Kòmand" />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-ink/70 dark:text-paper/70 mb-1">{t("shop_payment_label")}</span>
              <textarea className={inputClass} rows={3} maxLength={300} value={form.shopPaymentInfo} onChange={(e) => setForm({ ...form, shopPaymentInfo: e.target.value })} placeholder="MonCash: 3700-0000 (Non Biznis)" />
            </label>
            <button type="submit" disabled={saving} className="w-full bg-ink text-paper rounded-full py-2.5 text-sm font-medium disabled:opacity-50">
              {saving ? "..." : t("shop_save")}
            </button>
            {message && <p className={`text-sm text-center ${message.ok ? "text-forest" : "text-brick"}`}>{message.text}</p>}
          </form>

          {/* Pwodwi */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-display text-lg">{t("shop_products_heading")}</h2>
              {products.length > 0 && (
                <button onClick={publishAll} className="text-xs font-medium text-forest underline underline-offset-2">
                  {t("shop_publish_all")}
                </button>
              )}
            </div>
            <p className="text-xs text-ink/50 dark:text-paper/50 mb-3">{t("shop_products_hint")}</p>
            {products.length === 0 ? (
              <p className="text-sm text-center text-ink/40 dark:text-paper/40 py-8">{t("shop_no_products")}</p>
            ) : (
              <div className="space-y-2">
                {products.map((p) => {
                  const on = isOn(p.published);
                  return (
                    <div key={p.id} className="flex items-center gap-3 rounded-card border border-ink/10 dark:border-dark-border bg-white dark:bg-dark-surface p-3">
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-ink/5 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <p className="text-xs text-ink/50 dark:text-paper/50">
                          {p.stock} {p.unit || ""} · {Number(p.sellPrice).toLocaleString("fr-FR")} G
                          {!p.imageUrl && <span className="text-gold-dark"> · {t("shop_no_photo")}</span>}
                        </p>
                      </div>
                      <button
                        onClick={() => setPublished(p, !on)}
                        role="switch"
                        aria-checked={on}
                        className={`w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 ${on ? "bg-forest" : "bg-ink/20"}`}
                      >
                        <span className={`block w-5 h-5 rounded-full bg-white transition-transform ${on ? "translate-x-5" : ""}`} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
