"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Bell, Check, ChevronLeft, ChevronRight, Heart, Loader2, MessageCircle, Minus, Package, Plus, Share2, ShieldCheck, ShoppingBag, Star, Truck, X } from "lucide-react";
import { useShop, useT } from "./shop-context";
import { deliveryEta } from "@/lib/delivery-eta";
import { ProductRow } from "./product-card";
import { C, Price, StockLine, Stars, discountPct, fieldClass, fieldStyle } from "./ui";

interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export function ProductView({ productId }: { productId: string }) {
  const t = useT();
  const { shop, base, money, byId, inCartOf, addToCart, wish, toggleWish, recent, pushRecent, setNotifyFor, showToast } = useShop();
  const router = useRouter();
  const p = byId.get(productId);
  const [qty, setQ] = useState(1);
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [idx, setIdx] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  useEffect(() => setShareUrl(window.location.href), [productId]);

  useEffect(() => {
    if (p) pushRecent(p.id);
  }, [p?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setIdx(0);
    setQ(1);
    setSize("");
    setColor("");
    window.scrollTo({ top: 0 });
  }, [productId]);

  const related = useMemo(() => {
    if (!p) return [];
    const same = shop.products.filter((x) => x.id !== p.id && x.category === p.category && x.stock > 0);
    const rest = shop.products.filter((x) => x.id !== p.id && x.category !== p.category && x.stock > 0);
    return [...same, ...rest].slice(0, 12);
  }, [shop.products, p]);

  const seen = useMemo(() => recent.filter((id) => id !== productId).map((id) => byId.get(id)).filter((x): x is NonNullable<typeof x> => !!x).slice(0, 10), [recent, byId, productId]);

  if (!p) {
    return (
      <main className="max-w-xl mx-auto px-4 py-24 text-center">
        <p className="mb-6" style={{ color: C.muted }}>{t("Pwodwi sa a pa disponib ankò.")}</p>
        <Link href={base} className="rounded-xl px-7 py-3.5 font-semibold text-white inline-block" style={{ background: C.ink }}>{t("Retounen nan boutik la")}</Link>
      </main>
    );
  }

  const out = p.stock <= 0;
  const pct = discountPct(p);
  const liked = wish.includes(p.id);
  const inCart = inCartOf(p.id);
  const imgs = p.images;

  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: p!.name, url: shareUrl || window.location.href });
      else {
        await navigator.clipboard.writeText(shareUrl || window.location.href);
        showToast("Lyen kopye ✓");
      }
    } catch {
      /* itilizatè a anile */
    }
  }

  // Si pwodwi a gen gwosè/koulè, kliyan an dwe chwazi yo anvan
  function tryAdd(): boolean {
    if (p!.sizes.length > 0 && !size) {
      showToast("Chwazi yon gwosè.");
      return false;
    }
    if (p!.colors.length > 0 && !color) {
      showToast("Chwazi yon koulè.");
      return false;
    }
    addToCart(p!, qty, { size, color });
    return true;
  }

  function buyNow() {
    if (tryAdd()) router.push(`${base}/checkout`);
  }

  const waAsk = shop.whatsapp
    ? `https://wa.me/${shop.whatsapp}?text=${encodeURIComponent(t("Bonjou, mwen enterese nan \"{name}\" ({url}).", { name: p.name, url: shareUrl }))}`
    : null;

  return (
    <main className="max-w-6xl mx-auto px-4 pt-4 pb-28 md:pb-10">
      <nav className="text-xs mb-4 flex flex-wrap items-center gap-1.5" style={{ color: C.muted }}>
        <Link href={base} className="underline underline-offset-2">{t("Akèy")}</Link>/
        <Link href={`${base}?cat=${encodeURIComponent(p.category)}`} className="underline underline-offset-2">{p.category}</Link>/
        <span className="truncate max-w-[50vw]" style={{ color: C.ink }}>{p.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-6 lg:gap-12">
        {/* ---------- Galri ---------- */}
        <div>
          <div className="relative aspect-square rounded-2xl overflow-hidden border" style={{ background: C.soft, borderColor: C.line }}>
            {imgs.length ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imgs[idx]}
                alt={p.name}
                onClick={() => setZoom(true)}
                className={`w-full h-full object-cover cursor-zoom-in ${out ? "grayscale opacity-70" : ""}`}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ color: C.line }}><ShoppingBag size={72} /></div>
            )}
            {pct > 0 && !out && <span className="absolute top-3 left-3 rounded-md px-2.5 py-1 text-xs font-bold text-white" style={{ background: C.red }}>-{pct}%</span>}
            {imgs.length > 1 && (
              <>
                <button aria-label={t("Anvan")} onClick={() => setIdx((i) => (i - 1 + imgs.length) % imgs.length)} className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center"><ChevronLeft size={20} /></button>
                <button aria-label={t("Apre")} onClick={() => setIdx((i) => (i + 1) % imgs.length)} className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center"><ChevronRight size={20} /></button>
              </>
            )}
          </div>
          {imgs.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto [scrollbar-width:none]">
              {imgs.map((u, i) => (
                <button key={u} onClick={() => setIdx(i)} className="w-16 h-16 shrink-0 rounded-xl overflow-hidden border-2" style={{ borderColor: i === idx ? C.ink : C.line }} aria-label={t("Foto {n}", { n: i + 1 })}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={u} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ---------- Detay ---------- */}
        <div>
          {p.brand && <p className="text-xs font-semibold tracking-[0.14em] uppercase mb-1" style={{ color: C.muted }}>{p.brand}</p>}
          <h1 className="text-2xl sm:text-3xl font-bold leading-tight">{p.name}</h1>

          <a href="#avi" className="mt-2 inline-flex items-center gap-2 text-sm">
            {p.ratingCount > 0 ? (<><Stars value={p.rating} /> <b>{p.rating}</b> <span style={{ color: C.muted }}>{t("({n} avi)", { n: p.ratingCount })}</span></>) : (<span style={{ color: C.muted }}>{t("Poko gen avi")}</span>)}
            {p.sold > 0 && <span style={{ color: C.muted }}>{"· "}{t("{n} vann", { n: p.sold.toLocaleString("fr-FR") })}</span>}
          </a>

          <div className="mt-4"><Price p={p} money={money} big /></div>
          {pct > 0 && p.comparePrice && <p className="text-sm font-semibold mt-1" style={{ color: C.red }}>{t("Ou ekonomize")} {money(p.comparePrice - p.price)} ({pct}%)</p>}
          <div className="mt-2"><StockLine p={p} /></div>

          {!out && p.colors.length > 0 && <OptionPicker label={t("Koulè")} value={color} options={p.colors} onPick={setColor} />}
          {!out && p.sizes.length > 0 && <OptionPicker label={t("Gwosè")} value={size} options={p.sizes} onPick={setSize} />}

          {!out && (
            <div className="mt-5 flex items-center gap-3">
              <span className="text-sm font-semibold">{t("Kantite")}</span>
              <div className="flex items-center rounded-xl border h-12" style={{ borderColor: C.line }}>
                <button aria-label={t("Mwens")} onClick={() => setQ((n) => Math.max(1, n - 1))} className="w-11 h-full flex items-center justify-center"><Minus size={16} /></button>
                <span className="w-10 text-center font-bold tabular-nums">{qty}</span>
                <button aria-label={t("Plis")} onClick={() => setQ((n) => Math.min(p.stock, n + 1))} disabled={qty >= p.stock} className="w-11 h-full flex items-center justify-center disabled:opacity-30"><Plus size={16} /></button>
              </div>
              {p.unit && <span className="text-sm" style={{ color: C.muted }}>{p.unit}</span>}
            </div>
          )}

          <div className="mt-5 hidden md:flex gap-3">
            {out ? (
              <button onClick={() => setNotifyFor(p)} className="flex-1 min-h-[52px] rounded-xl border-2 font-bold flex items-center justify-center gap-2" style={{ borderColor: C.ink }}><Bell size={18} /> {t("Notifye m lè l disponib")}</button>
            ) : (
              <>
                <button onClick={tryAdd} className="flex-1 min-h-[52px] rounded-xl border-2 font-bold flex items-center justify-center gap-2" style={{ borderColor: C.ink }}><ShoppingBag size={18} /> {inCart ? t("Ajoute ankò ({n})", { n: inCart }) : t("Ajoute nan panye")}</button>
                <button onClick={buyNow} className="flex-1 min-h-[52px] rounded-xl font-bold text-white" style={{ background: C.red }}>{t("Achte kounye a")}</button>
              </>
            )}
            <button onClick={() => toggleWish(p.id)} aria-label={t("Favori")} aria-pressed={liked} className="w-[52px] h-[52px] rounded-xl border-2 flex items-center justify-center" style={{ borderColor: C.line }}>
              <Heart size={22} color={liked ? C.red : C.ink} fill={liked ? C.red : "none"} />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold">
            <button onClick={share} className="inline-flex items-center gap-1.5 underline underline-offset-2"><Share2 size={16} /> {t("Pataje")}</button>
            {waAsk && <a href={waAsk} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 underline underline-offset-2"><MessageCircle size={16} /> {t("Poze yon kesyon")}</a>}
          </div>

          <div className="mt-6 rounded-2xl border divide-y text-sm" style={{ borderColor: C.line }}>
            {shop.deliveryEnabled && (
              <Info icon={<Truck size={18} />} title={t("Livrezon")}>
                {shop.deliveryFee > 0 ? `${money(shop.deliveryFee)}` : t("Gratis")}
                {shop.freeShippingMin > 0 && shop.deliveryFee > 0 ? t(" · gratis pou {amount}+", { amount: money(shop.freeShippingMin) }) : ""}
                {deliveryEta(shop.deliveryMinDays, shop.deliveryMaxDays, t) ? ` · ${deliveryEta(shop.deliveryMinDays, shop.deliveryMaxDays, t)}` : ""}
              </Info>
            )}
            {shop.pickupEnabled && <Info icon={<Package size={18} />} title={t("Ranmase nan boutik")}>{t("Gratis")}{shop.address ? ` · ${shop.address}` : ""}</Info>}
            <Info icon={<ShieldCheck size={18} />} title={t("Peman")}>{t("MonCash, NatCash, transfè bank oswa kach lè w resevwa")}</Info>
          </div>

          {p.description && (
            <div className="mt-6">
              <h2 className="font-bold mb-2">{t("Deskripsyon")}</h2>
              <p className="text-[15px] leading-relaxed whitespace-pre-line" style={{ color: "#3A3A3A" }}>{p.description}</p>
            </div>
          )}
          <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm">
            <dt style={{ color: C.muted }}>{t("Kategori")}</dt><dd>{p.category}</dd>
            {p.brand && (<><dt style={{ color: C.muted }}>{t("Mak")}</dt><dd>{p.brand}</dd></>)}
            {p.unit && (<><dt style={{ color: C.muted }}>{t("Inite")}</dt><dd>{p.unit}</dd></>)}
          </dl>
        </div>
      </div>

      <Reviews productId={p.id} />

      <div className="-mx-4 mt-10">
        <ProductRow title={t("Ou ka renmen tou")} products={related} />
        <ProductRow title={t("Ou fèk gade")} products={seen} />
      </div>

      {/* Bar achte fiks (telefòn) */}
      <div className="md:hidden fixed inset-x-0 z-30 bg-white border-t px-3 py-2.5 flex gap-2" style={{ borderColor: C.line, bottom: "calc(3.6rem + env(safe-area-inset-bottom))" }}>
        <button onClick={() => toggleWish(p.id)} aria-label={t("Favori")} className="w-12 h-12 rounded-xl border flex items-center justify-center shrink-0" style={{ borderColor: C.line }}>
          <Heart size={20} color={liked ? C.red : C.ink} fill={liked ? C.red : "none"} />
        </button>
        {out ? (
          <button onClick={() => setNotifyFor(p)} className="flex-1 h-12 rounded-xl border-2 font-bold flex items-center justify-center gap-2" style={{ borderColor: C.ink }}><Bell size={16} /> {t("Notifye m")}</button>
        ) : (
          <>
            <button onClick={tryAdd} className="flex-1 h-12 rounded-xl border-2 font-bold text-sm" style={{ borderColor: C.ink }}>{t("Ajoute")}</button>
            <button onClick={buyNow} className="flex-1 h-12 rounded-xl font-bold text-white text-sm" style={{ background: C.red }}>{t("Achte kounye a")}</button>
          </>
        )}
      </div>

      {zoom && imgs.length > 0 && (
        <div className="fixed inset-0 z-[80] bg-black/90 flex items-center justify-center p-4" onClick={() => setZoom(false)}>
          <button aria-label={t("Fèmen")} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center" onClick={() => setZoom(false)}><X size={22} /></button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imgs[idx]} alt={p.name} className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </main>
  );
}

function OptionPicker({ label, value, options, onPick }: { label: string; value: string; options: string[]; onPick: (v: string) => void }) {
  const t = useT();
  return (
    <div className="mt-5">
      <p className="text-sm font-semibold mb-2">
        {label}: <span className="font-normal" style={{ color: value ? C.ink : C.muted }}>{value || t("chwazi youn")}</span>
      </p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {options.map((o) => {
          const on = o === value;
          return (
            <button
              key={o}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onPick(o)}
              className="min-w-[3rem] h-11 px-4 rounded-xl border-2 text-sm font-semibold"
              style={on ? { background: C.ink, color: "#fff", borderColor: C.ink } : { background: "#fff", borderColor: C.line }}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Info({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 px-4 py-3" style={{ borderColor: C.line }}>
      <span className="mt-0.5 shrink-0">{icon}</span>
      <p><b>{title}</b> <span style={{ color: "#3A3A3A" }}>— {children}</span></p>
    </div>
  );
}

/* ------------------------------ Avi kliyan ------------------------------ */

function Reviews({ productId }: { productId: string }) {
  const t = useT();
  const { shop } = useShop();
  const sp = useSearchParams();
  const [data, setData] = useState<{ reviews: Review[]; avg: number; count: number } | null>(null);
  const [open, setOpen] = useState(!!sp.get("code"));

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/shop/${shop.slug}/reviews?productId=${productId}`, { cache: "no-store" });
      if (res.ok) setData(await res.json());
    } catch {
      /* ignore */
    }
  }, [shop.slug, productId]);

  useEffect(() => {
    setData(null);
    load();
  }, [load]);

  const dist = useMemo(() => {
    const d = [0, 0, 0, 0, 0];
    for (const r of data?.reviews ?? []) d[Math.max(1, Math.min(5, r.rating)) - 1]++;
    return d;
  }, [data]);

  return (
    <section id="avi" className="mt-12 scroll-mt-32">
      <div className="flex items-center justify-between mb-4 gap-3">
        <h2 className="text-xl font-bold">{t("Avi kliyan")}</h2>
        {!open && <button onClick={() => setOpen(true)} className="rounded-full border-2 px-5 py-2 text-sm font-bold" style={{ borderColor: C.ink }}>{t("Ekri yon avi")}</button>}
      </div>

      {data && data.count > 0 && (
        <div className="flex flex-col sm:flex-row gap-6 mb-6 items-start">
          <div className="text-center sm:pr-6 sm:border-r" style={{ borderColor: C.line }}>
            <p className="text-5xl font-bold tabular-nums">{data.avg}</p>
            <Stars value={data.avg} size={18} />
            <p className="text-xs mt-1" style={{ color: C.muted }}>{t("{n} avi", { n: data.count })}</p>
          </div>
          <div className="flex-1 w-full max-w-sm space-y-1">
            {[5, 4, 3, 2, 1].map((n) => {
              const total = dist.reduce((a, b) => a + b, 0) || 1;
              return (
                <div key={n} className="flex items-center gap-2 text-xs">
                  <span className="w-3">{n}</span><Star size={12} color={C.star} fill={C.star} />
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: C.line }}><div className="h-full" style={{ width: `${(dist[n - 1] / total) * 100}%`, background: C.star }} /></div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {open && <ReviewForm productId={productId} onDone={() => { setOpen(false); load(); }} onCancel={() => setOpen(false)} />}

      {!data ? (
        <Loader2 className="animate-spin" size={20} />
      ) : data.reviews.length === 0 ? (
        <p className="text-sm" style={{ color: C.muted }}>{t("Poko gen avi. Se ou ki ka premye a — sèlman kliyan ki achte pwodwi a ka bay yon avi.")}</p>
      ) : (
        <ul className="divide-y" style={{ borderColor: C.line }}>
          {data.reviews.map((r) => (
            <li key={r.id} className="py-4" style={{ borderColor: C.line }}>
              <div className="flex items-center gap-2 mb-1"><Stars value={r.rating} /><span className="text-sm font-semibold">{r.name}</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: C.ok }}><Check size={12} /> {t("Achte verifye")}</span></div>
              {r.comment && <p className="text-sm leading-relaxed">{r.comment}</p>}
              <p className="text-xs mt-1" style={{ color: C.muted }}>{new Date(r.createdAt).toLocaleDateString("fr-FR")}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ReviewForm({ productId, onDone, onCancel }: { productId: string; onDone: () => void; onCancel: () => void }) {
  const t = useT();
  const { shop, orders, customer } = useShop();
  const sp = useSearchParams();
  const [rating, setRating] = useState(0);
  const [name, setName] = useState(customer?.name?.split(" ")[0] ?? "");
  const [comment, setComment] = useState("");
  const [code, setCode] = useState(sp.get("code") ?? orders[0]?.code ?? "");
  const [phone, setPhone] = useState(sp.get("phone") ?? orders[0]?.phone ?? customer?.phone ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) return setError(t("Chwazi yon nòt (1 a 5 etwal)."));
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/shop/${shop.slug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, rating, name, comment, orderCode: code, phone }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error ? t(data.error) : t("Pa ka voye avi a."));
      else return onDone();
    } catch {
      setError(t("Erè rezo — eseye ankò."));
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border p-4 mb-6 space-y-3" style={{ borderColor: C.line }}>
      <p className="text-sm" style={{ color: C.muted }}>{t("Pou evite fo avi, antre kòd kòmand ou ak telefòn ou itilize a.")}</p>
      <div className="flex gap-1" role="radiogroup" aria-label={t("Nòt")}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button type="button" key={n} onClick={() => setRating(n)} aria-label={t("{n} etwal", { n })} className="p-1">
            <Star size={30} color={C.star} fill={n <= rating ? C.star : "none"} />
          </button>
        ))}
      </div>
      <input className={fieldClass} style={fieldStyle} placeholder={t("Non ou *")} value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={40} />
      <textarea className={fieldClass} style={fieldStyle} placeholder={t("Kòmantè (opsyonèl)")} rows={3} maxLength={500} value={comment} onChange={(e) => setComment(e.target.value)} />
      <div className="grid grid-cols-2 gap-2">
        <input className={fieldClass} style={fieldStyle} placeholder={t("Kòd kòmand *")} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required />
        <input className={fieldClass} style={fieldStyle} placeholder={t("Telefòn *")} inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="flex-1 min-h-[48px] rounded-xl border font-semibold" style={{ borderColor: C.line }}>{t("Anile")}</button>
        <button disabled={busy} className="flex-1 min-h-[48px] rounded-xl font-bold text-white disabled:opacity-60 flex items-center justify-center" style={{ background: C.ink }}>{busy ? <Loader2 size={18} className="animate-spin" /> : t("Pibliye avi a")}</button>
      </div>
      {error && <p className="text-sm text-center font-medium" style={{ color: C.red }}>{error}</p>}
    </form>
  );
}
