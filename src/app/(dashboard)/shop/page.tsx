"use client";

import { useEffect, useState, useCallback } from "react";
import { Store, Loader2, Copy, ExternalLink, MessageCircle, Check, ImagePlus } from "lucide-react";
import { uploadProductImage } from "@/lib/compress-image";
import { BusinessSwitcher } from "@/components/dashboard/business-switcher";
import { CouponsManager } from "@/components/shop/coupons-manager";
import { useLanguage } from "@/lib/i18n/language-provider";
import type { Product } from "@/types";

interface ShopSettings {
  id: string;
  name: string;
  icon: string;
  slug: string;
  shopEnabled: boolean;
  whatsapp: string;
  shopName: string;
  shopLogo: string;
  shopCover: string;
  shopCovers?: string[];
  shopAccent?: string;
  shopHeroTitle?: string;
  shopHeroText?: string;
  shopHeroOverlay?: number;
  shopHeroSize?: "sm" | "md" | "lg";
  shopSlideSeconds?: number;
  shopTagline: string;
  shopPaymentInfo: string;
  shopAnnouncement: string;
  shopDeliveryEnabled: boolean;
  shopPickupEnabled: boolean;
  shopDeliveryFee: number;
  shopFreeShippingMin: number;
  shopDeliveryMinDays: number;
  shopDeliveryMaxDays: number;
  shopAddress: string;
  shopHours: string;
  shopType?: "store" | "restaurant";
  shopPrepTime?: string;
  shopAcceptingOrders?: boolean;
  shopPolicies: string;
  shopFacebook: string;
  shopInstagram: string;
  currency: string;
  productCount: number;
  publishedCount: number;
}

const inputClass =
  "w-full border border-ink/15 dark:border-dark-border bg-white dark:bg-dark-surface rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brick/30";

const isOn = (v: unknown) => v === true || v === "true";

export default function ShopPage() {
  const { t } = useLanguage();
  const [shops, setShops] = useState<ShopSettings[] | null>(null);
  const [locked, setLocked] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [form, setForm] = useState({
    slug: "", whatsapp: "", shopName: "", shopLogo: "", shopCover: "", shopCovers: [] as string[], shopAccent: "", shopHeroTitle: "", shopHeroText: "", shopHeroOverlay: 55, shopHeroSize: "md" as "sm" | "md" | "lg", shopSlideSeconds: 5, shopTagline: "", shopPaymentInfo: "",
    shopAnnouncement: "", shopDeliveryEnabled: true, shopPickupEnabled: true, shopDeliveryFee: "", shopFreeShippingMin: "", shopDeliveryMinDays: "", shopDeliveryMaxDays: "",
    shopAddress: "", shopHours: "", shopPolicies: "", shopFacebook: "", shopInstagram: "",
    shopType: "store" as "store" | "restaurant", shopPrepTime: "", shopAcceptingOrders: true,
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const loadShops = useCallback(async () => {
    try {
      const res = await fetch("/api/shop/settings");
      const data = await res.json();
      setLocked(!!data.locked);
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
      slug: String(active.slug ?? ""),
      whatsapp: String(active.whatsapp ?? ""),
      shopName: active.shopName,
      shopLogo: active.shopLogo,
      shopCover: active.shopCover ?? "",
      shopCovers: active.shopCovers ?? (active.shopCover ? [active.shopCover] : []),
      shopAccent: active.shopAccent ?? "",
      shopHeroTitle: active.shopHeroTitle ?? "",
      shopHeroText: active.shopHeroText ?? "",
      shopHeroOverlay: active.shopHeroOverlay ?? 55,
      shopHeroSize: active.shopHeroSize ?? "md",
      shopSlideSeconds: active.shopSlideSeconds ?? 5,
      shopTagline: active.shopTagline,
      shopPaymentInfo: active.shopPaymentInfo,
      shopAnnouncement: active.shopAnnouncement ?? "",
      shopDeliveryEnabled: active.shopDeliveryEnabled !== false,
      shopPickupEnabled: active.shopPickupEnabled !== false,
      shopDeliveryFee: active.shopDeliveryFee ? String(active.shopDeliveryFee) : "",
      shopFreeShippingMin: active.shopFreeShippingMin ? String(active.shopFreeShippingMin) : "",
      shopDeliveryMinDays: active.shopDeliveryMinDays ? String(active.shopDeliveryMinDays) : "",
      shopDeliveryMaxDays: active.shopDeliveryMaxDays ? String(active.shopDeliveryMaxDays) : "",
      shopAddress: active.shopAddress ?? "",
      shopHours: active.shopHours ?? "",
      shopType: active.shopType === "restaurant" ? "restaurant" : "store",
      shopPrepTime: active.shopPrepTime ?? "",
      shopAcceptingOrders: active.shopAcceptingOrders !== false,
      shopPolicies: active.shopPolicies ?? "",
      shopFacebook: active.shopFacebook ?? "",
      shopInstagram: active.shopInstagram ?? "",
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
        shopName: form.shopName,
        shopLogo: form.shopLogo,
        shopCovers: form.shopCovers,
        shopAccent: form.shopAccent,
        shopHeroTitle: form.shopHeroTitle,
        shopHeroText: form.shopHeroText,
        shopHeroOverlay: form.shopHeroOverlay,
        shopHeroSize: form.shopHeroSize,
        shopSlideSeconds: form.shopSlideSeconds,
        shopTagline: form.shopTagline,
        shopPaymentInfo: form.shopPaymentInfo,
        shopAnnouncement: form.shopAnnouncement,
        shopType: form.shopType,
        shopPrepTime: form.shopPrepTime,
        shopAcceptingOrders: form.shopAcceptingOrders,
        shopDeliveryEnabled: form.shopDeliveryEnabled,
        shopPickupEnabled: form.shopPickupEnabled,
        shopDeliveryFee: Number(form.shopDeliveryFee) || 0,
        shopFreeShippingMin: Number(form.shopFreeShippingMin) || 0,
        shopDeliveryMinDays: Math.floor(Number(form.shopDeliveryMinDays)) || 0,
        shopDeliveryMaxDays: Math.floor(Number(form.shopDeliveryMaxDays)) || 0,
        shopAddress: form.shopAddress,
        shopHours: form.shopHours,
        shopPolicies: form.shopPolicies,
        shopFacebook: form.shopFacebook,
        shopInstagram: form.shopInstagram,
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

  const [logoBusy, setLogoBusy] = useState(false);
  async function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setLogoBusy(true);
    try {
      const url = await uploadProductImage(file);
      setForm((f) => ({ ...f, shopLogo: url }));
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Erè foto." });
    }
    setLogoBusy(false);
  }

  const [coverBusy, setCoverBusy] = useState(false);
  async function handleCover(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    setCoverBusy(true);
    try {
      const room = Math.max(0, 6 - form.shopCovers.length);
      const urls: string[] = [];
      for (const f of files.slice(0, room)) urls.push(await uploadProductImage(f, 1400));
      setForm((f) => ({ ...f, shopCovers: [...f.shopCovers, ...urls].slice(0, 6) }));
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Erè foto." });
    }
    setCoverBusy(false);
  }

  function moveCover(idx: number, dir: -1 | 1) {
    setForm((f) => {
      const list = [...f.shopCovers];
      const j = idx + dir;
      if (j < 0 || j >= list.length) return f;
      [list[idx], list[j]] = [list[j], list[idx]];
      return { ...f, shopCovers: list };
    });
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
      <main className="max-w-3xl mx-auto px-4 py-16 flex flex-col items-center text-ink/40 dark:text-white/40">
        <Loader2 size={24} className="animate-spin mb-2" />
        <p className="text-sm">Ap chaje...</p>
      </main>
    );
  }

  if (locked) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 text-center">
        <Store size={28} className="mx-auto mb-3 text-ink/30" />
        <p className="font-semibold mb-1">Boutik piblik pa enkli nan plan ou</p>
        <p className="text-sm text-ink/60 dark:text-white/60">Kontakte administratè a pou chanje plan ou si ou vle yon boutik piblik.</p>
      </main>
    );
  }

  if (shops.length === 0) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 text-center">
        <Store size={28} className="mx-auto mb-3 text-ink/30" />
        <p className="text-sm text-ink/60 dark:text-white/60">{t("shop_need_business")}</p>
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
      <h1 className="font-display font-semibold text-xl lg:text-2xl mb-1">{t("shop_title")}</h1>
      <p className="text-sm text-ink/60 dark:text-white/60 mb-5">{t("shop_subtitle")}</p>

      <BusinessSwitcher
        businesses={shops.map((b) => ({ id: b.id, name: b.name, icon: b.icon }))}
        activeId={activeId ?? ""}
        onSelect={setActiveId}
        showOverviewTab={false}
      />

      {!active ? (
        <p className="text-sm text-center text-ink/40 dark:text-white/40 py-10">{t("choose_business_prompt")}</p>
      ) : (
        <div className="mt-5 space-y-5">
          {/* Lyen + switch */}
          <div className="rounded-card border border-ink/10 dark:border-dark-border bg-white dark:bg-dark-surface p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium">{active.shopEnabled ? t("shop_enabled") : t("shop_disabled")}</p>
                <p className="text-xs text-ink/50 dark:text-white/50">
                  {active.publishedCount}/{active.productCount} {t("nav_products").toLowerCase()}
                </p>
              </div>
              <button
                onClick={toggleShop}
                role="switch"
                aria-checked={active.shopEnabled}
                className={`w-12 h-7 rounded-full p-1 transition-colors ${active.shopEnabled ? "bg-brick" : "bg-ink/20"}`}
              >
                <span className={`block w-5 h-5 rounded-full bg-white transition-transform ${active.shopEnabled ? "translate-x-5" : ""}`} />
              </button>
            </div>

            {active.slug ? (
              <>
                <p className="text-xs text-ink/50 dark:text-white/50 mb-1">{t("shop_link")}</p>
                <p className="stat-figure text-sm break-all rounded bg-ink/5 dark:bg-white/5 px-3 py-2 mb-3">{link}</p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={copyLink} className="inline-flex items-center gap-1.5 rounded-md border border-ink/15 dark:border-dark-border px-3.5 py-2 text-xs font-medium">
                    {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? t("shop_copied") : t("shop_copy")}
                  </button>
                  <a href={link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-md border border-ink/15 dark:border-dark-border px-3.5 py-2 text-xs font-medium">
                    <ExternalLink size={14} /> {t("shop_open")}
                  </a>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`${active.name} — ${link}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md bg-brick hover:bg-brick-dark text-white px-3.5 py-2 text-xs font-medium"
                  >
                    <MessageCircle size={14} /> {t("shop_share_whatsapp")}
                  </a>
                </div>
              </>
            ) : (
              <p className="text-xs text-ink/60 dark:text-white/60">
                Pouse switch la pou kreye lyen boutik la epi anrejistre paramèt yo.
              </p>
            )}
          </div>

          {/* Paramèt */}
          <form onSubmit={saveSettings} className="rounded-card border border-ink/10 dark:border-dark-border bg-white dark:bg-dark-surface p-5 space-y-4">
            <div>
              <span className="block text-xs font-medium text-ink/70 dark:text-white/70 mb-1">Imaj background (jiska 6 — yo chanje otomatikman)</span>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {form.shopCovers.map((u, idx) => (
                  <div key={u} className="relative aspect-video rounded-lg overflow-hidden border border-ink/15 dark:border-dark-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={u} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/55 text-white text-[11px]">
                      <button type="button" onClick={() => moveCover(idx, -1)} disabled={idx === 0} className="px-2 py-0.5 disabled:opacity-30">◀</button>
                      <button type="button" onClick={() => setForm({ ...form, shopCovers: form.shopCovers.filter((x) => x !== u) })} className="px-2 py-0.5">✕</button>
                      <button type="button" onClick={() => moveCover(idx, 1)} disabled={idx === form.shopCovers.length - 1} className="px-2 py-0.5 disabled:opacity-30">▶</button>
                    </div>
                  </div>
                ))}
                {form.shopCovers.length < 6 && (
                  <label className="relative aspect-video rounded-lg border border-dashed border-ink/25 dark:border-dark-border flex flex-col items-center justify-center gap-1 text-ink/40 text-xs cursor-pointer">
                    {coverBusy ? <Loader2 size={18} className="animate-spin" /> : <><ImagePlus size={20} /> Ajoute</>}
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleCover} />
                  </label>
                )}
              </div>
              <p className="mt-1 text-[11px] text-ink/50 dark:text-white/50">Imaj laj (peyizaj) mache pi byen. Ou ka chwazi plizyè imaj yon sèl fwa.</p>
            </div>

            <div className="rounded-card border border-ink/10 dark:border-dark-border p-3 space-y-3">
              <p className="text-sm font-semibold">Pèsonalize aparans boutik la</p>
              <label className="flex items-center gap-3">
                <span className="text-xs font-medium text-ink/70 dark:text-white/70 w-32">Koulè prensipal</span>
                <input type="color" value={form.shopAccent || "#C8102E"} onChange={(e) => setForm({ ...form, shopAccent: e.target.value })} className="h-9 w-12 rounded border border-ink/15 bg-transparent p-0.5" />
                <span className="text-xs text-ink/50 dark:text-white/50">{form.shopAccent || "#C8102E (default)"}</span>
                {form.shopAccent && <button type="button" onClick={() => setForm({ ...form, shopAccent: "" })} className="text-xs text-brick underline underline-offset-2">Reyajiste</button>}
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-ink/70 dark:text-white/70 mb-1">Gwo tit sou imaj la (si vid: non boutik la)</span>
                <input className={inputClass} maxLength={80} value={form.shopHeroTitle} onChange={(e) => setForm({ ...form, shopHeroTitle: e.target.value })} />
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-ink/70 dark:text-white/70 mb-1">Ti tèks anba tit la</span>
                <input className={inputClass} maxLength={160} value={form.shopHeroText} onChange={(e) => setForm({ ...form, shopHeroText: e.target.value })} />
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-ink/70 dark:text-white/70 mb-1">Fonse imaj la (pou tèks la ka li): {form.shopHeroOverlay}%</span>
                <input type="range" min={0} max={90} step={5} value={form.shopHeroOverlay} onChange={(e) => setForm({ ...form, shopHeroOverlay: Number(e.target.value) })} className="w-full accent-red-600" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="block text-xs font-medium text-ink/70 dark:text-white/70 mb-1">Wotè imaj la</span>
                  <select className={inputClass} value={form.shopHeroSize} onChange={(e) => setForm({ ...form, shopHeroSize: e.target.value as "sm" | "md" | "lg" })}>
                    <option value="sm">Piti</option>
                    <option value="md">Mwayen</option>
                    <option value="lg">Gwo</option>
                  </select>
                </label>
                <label className="block">
                  <span className="block text-xs font-medium text-ink/70 dark:text-white/70 mb-1">Chanje imaj chak</span>
                  <select className={inputClass} value={form.shopSlideSeconds} onChange={(e) => setForm({ ...form, shopSlideSeconds: Number(e.target.value) })}>
                    {[3, 5, 7, 10].map((n) => <option key={n} value={n}>{n} segonn</option>)}
                  </select>
                </label>
              </div>
            </div>
            <div>
              <span className="block text-xs font-medium text-ink/70 dark:text-white/70 mb-1">{t("shop_logo_label")}</span>
              <div className="flex items-center gap-3">
                <label className="w-16 h-16 rounded-full border border-dashed border-ink/25 dark:border-dark-border overflow-hidden flex items-center justify-center cursor-pointer bg-white dark:bg-dark-surface">
                  {logoBusy ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : form.shopLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.shopLogo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <ImagePlus size={20} className="text-ink/40" />
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogo} />
                </label>
                {form.shopLogo && (
                  <button type="button" onClick={() => setForm({ ...form, shopLogo: "" })} className="text-xs text-brick underline underline-offset-2">
                    Retire
                  </button>
                )}
              </div>
            </div>
            <label className="block">
              <span className="block text-xs font-medium text-ink/70 dark:text-white/70 mb-1">{t("shop_name_label")}</span>
              <input className={inputClass} maxLength={60} value={form.shopName} onChange={(e) => setForm({ ...form, shopName: e.target.value })} placeholder={active.name} />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-ink/70 dark:text-white/70 mb-1">{t("shop_slug_label")}</span>
              <div className="flex items-center gap-1 text-sm">
                <span className="text-ink/40 shrink-0">/boutik/</span>
                <input className={inputClass} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="non-biznis-ou" />
              </div>
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-ink/70 dark:text-white/70 mb-1">Tip boutik</span>
              <select className={inputClass} value={form.shopType} onChange={(e) => setForm({ ...form, shopType: e.target.value as "store" | "restaurant" })}>
                <option value="store">Boutik anliy (pwodwi)</option>
                <option value="restaurant">Restoran (meni manje)</option>
              </select>
              {form.shopType === "restaurant" && (
                <span className="block text-xs text-ink/50 dark:text-white/50 mt-1">Pwodwi ou yo ap parèt kòm yon meni. Nan fòm pwodwi a, chwazi tip "Plat restoran".</span>
              )}
            </label>
            {form.shopType === "restaurant" && (
              <>
                <label className="block">
                  <span className="block text-xs font-medium text-ink/70 dark:text-white/70 mb-1">Tan preparasyon / livrezon (ekz: 20-30 min)</span>
                  <input className={inputClass} maxLength={40} value={form.shopPrepTime} onChange={(e) => setForm({ ...form, shopPrepTime: e.target.value })} placeholder="20-30 min" />
                </label>
                <label className="flex items-center justify-between gap-3 rounded-xl border border-ink/15 dark:border-dark-border px-3 py-2.5 cursor-pointer">
                  <span className="text-sm">Restoran an ouvè (ap pran kòmand kounye a)</span>
                  <input type="checkbox" checked={form.shopAcceptingOrders} onChange={(e) => setForm({ ...form, shopAcceptingOrders: e.target.checked })} className="w-5 h-5 accent-red-600" />
                </label>
              </>
            )}
            <label className="block">
              <span className="block text-xs font-medium text-ink/70 dark:text-white/70 mb-1">{t("shop_whatsapp_label")}</span>
              <input className={inputClass} inputMode="tel" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="50937001234" />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-ink/70 dark:text-white/70 mb-1">{t("shop_tagline_label")}</span>
              <input className={inputClass} maxLength={60} value={form.shopTagline} onChange={(e) => setForm({ ...form, shopTagline: e.target.value })} placeholder="Katalòg & Kòmand" />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-ink/70 dark:text-white/70 mb-1">{t("shop_payment_label")}</span>
              <textarea className={inputClass} rows={3} maxLength={300} value={form.shopPaymentInfo} onChange={(e) => setForm({ ...form, shopPaymentInfo: e.target.value })} placeholder="MonCash: 3700-0000 (Non Biznis)" />
            </label>
            <div className="pt-2 border-t border-ink/10 dark:border-dark-border">
              <h3 className="font-display font-semibold mb-3">Anons, livrezon ak kontak</h3>
              <div className="space-y-4">
                <label className="block">
                  <span className="block text-xs font-medium text-ink/70 dark:text-white/70 mb-1">Bann anons (anlè sit la)</span>
                  <input className={inputClass} maxLength={140} value={form.shopAnnouncement} onChange={(e) => setForm({ ...form, shopAnnouncement: e.target.value })} placeholder="Ekz: Rabè 20% pou tout chosi nan wikenn sa a!" />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 text-sm rounded-md border border-ink/15 dark:border-dark-border px-3 py-2.5 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 accent-red-600" checked={form.shopDeliveryEnabled} onChange={(e) => setForm({ ...form, shopDeliveryEnabled: e.target.checked })} /> Livrezon
                  </label>
                  <label className="flex items-center gap-2 text-sm rounded-md border border-ink/15 dark:border-dark-border px-3 py-2.5 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 accent-red-600" checked={form.shopPickupEnabled} onChange={(e) => setForm({ ...form, shopPickupEnabled: e.target.checked })} /> Ranmase nan boutik
                  </label>
                </div>
                {form.shopDeliveryEnabled && (
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="block text-xs font-medium text-ink/70 dark:text-white/70 mb-1">Frè livrezon ({active.currency})</span>
                      <input className={inputClass} type="number" min={0} value={form.shopDeliveryFee} onChange={(e) => setForm({ ...form, shopDeliveryFee: e.target.value })} placeholder="0 = gratis" />
                    </label>
                    <label className="block">
                      <span className="block text-xs font-medium text-ink/70 dark:text-white/70 mb-1">Livrezon gratis si total ≥</span>
                      <input className={inputClass} type="number" min={0} value={form.shopFreeShippingMin} onChange={(e) => setForm({ ...form, shopFreeShippingMin: e.target.value })} placeholder="0 = pa gen" />
                    </label>
                  </div>
                )}
                {form.shopDeliveryEnabled && (
                  <div>
                    <span className="block text-xs font-medium text-ink/70 dark:text-white/70 mb-1">Tan livrezon (an jou) — kliyan an ap resevwa pwodui a nan entèval sa a</span>
                    <div className="grid grid-cols-2 gap-3">
                      <input className={inputClass} type="number" min={0} max={90} value={form.shopDeliveryMinDays} onChange={(e) => setForm({ ...form, shopDeliveryMinDays: e.target.value })} placeholder="Soti (ekz: 2)" aria-label="Minimòm jou" />
                      <input className={inputClass} type="number" min={0} max={90} value={form.shopDeliveryMaxDays} onChange={(e) => setForm({ ...form, shopDeliveryMaxDays: e.target.value })} placeholder="Jiska (ekz: 5)" aria-label="Maksimòm jou" />
                    </div>
                    <p className="text-xs text-ink/50 dark:text-white/50 mt-1">Ekz: 2 ak 5 = « 2 a 5 jou ». Kite vid pou pa montre tan.</p>
                  </div>
                )}
                <label className="block">
                  <span className="block text-xs font-medium text-ink/70 dark:text-white/70 mb-1">Adrès boutik la (pou ranmase)</span>
                  <input className={inputClass} maxLength={200} value={form.shopAddress} onChange={(e) => setForm({ ...form, shopAddress: e.target.value })} placeholder="Ekz: 12 Rue Capois, Pétion-Ville" />
                </label>
                <label className="block">
                  <span className="block text-xs font-medium text-ink/70 dark:text-white/70 mb-1">Orè</span>
                  <input className={inputClass} maxLength={120} value={form.shopHours} onChange={(e) => setForm({ ...form, shopHours: e.target.value })} placeholder="Ekz: Lendi–Samdi 8h–18h" />
                </label>
                <label className="block">
                  <span className="block text-xs font-medium text-ink/70 dark:text-white/70 mb-1">Politik retou / garanti</span>
                  <textarea className={inputClass} rows={3} maxLength={1000} value={form.shopPolicies} onChange={(e) => setForm({ ...form, shopPolicies: e.target.value })} placeholder="Ekz: Retou aksepte nan 3 jou si pwodwi a pa louvri." />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="block text-xs font-medium text-ink/70 dark:text-white/70 mb-1">Facebook</span>
                    <input className={inputClass} maxLength={120} value={form.shopFacebook} onChange={(e) => setForm({ ...form, shopFacebook: e.target.value })} placeholder="non-paj oswa lyen" />
                  </label>
                  <label className="block">
                    <span className="block text-xs font-medium text-ink/70 dark:text-white/70 mb-1">Instagram</span>
                    <input className={inputClass} maxLength={120} value={form.shopInstagram} onChange={(e) => setForm({ ...form, shopInstagram: e.target.value })} placeholder="@non" />
                  </label>
                </div>
              </div>
            </div>
            <button type="submit" disabled={saving} className="w-full bg-brick hover:bg-brick-dark text-white rounded-md py-2.5 text-sm font-medium disabled:opacity-50">
              {saving ? "..." : t("shop_save")}
            </button>
            {message && <p className={`text-sm text-center ${message.ok ? "text-forest" : "text-brick"}`}>{message.text}</p>}
          </form>

          {/* Koupon */}
          <CouponsManager businessId={active.id} currency={active.currency} />

          {/* Pwodwi */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-display font-semibold text-lg">{t("shop_products_heading")}</h2>
              {products.length > 0 && (
                <button onClick={publishAll} className="text-xs font-medium text-forest underline underline-offset-2">
                  {t("shop_publish_all")}
                </button>
              )}
            </div>
            <p className="text-xs text-ink/50 dark:text-white/50 mb-3">{t("shop_products_hint")}</p>
            {products.length === 0 ? (
              <p className="text-sm text-center text-ink/40 dark:text-white/40 py-8">{t("shop_no_products")}</p>
            ) : (
              <div className="space-y-2">
                {products.map((p) => {
                  const on = isOn(p.published);
                  return (
                    <div key={p.id} className="flex items-center gap-3 rounded-card border border-ink/10 dark:border-dark-border bg-white dark:bg-dark-surface p-3">
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img loading="lazy" decoding="async" src={p.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-ink/5 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <p className="text-xs text-ink/50 dark:text-white/50">
                          {p.stock} {p.unit || ""} · {Number(p.sellPrice).toLocaleString("fr-FR")} G
                          {!p.imageUrl && <span className="text-gold-dark"> · {t("shop_no_photo")}</span>}
                        </p>
                      </div>
                      <button
                        onClick={() => setPublished(p, !on)}
                        role="switch"
                        aria-checked={on}
                        className={`w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 ${on ? "bg-brick" : "bg-ink/20"}`}
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
