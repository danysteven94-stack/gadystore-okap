"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Check, ChevronLeft, ChevronRight, Heart, Loader2, Minus, Plus, RotateCcw, Share2, Store, Truck } from "lucide-react";
import { useShop } from "./shop-provider";
import { ProductRow } from "./product-card";
import { C, PriceBlock, Sheet, StarInput, Stars, field } from "./ui";
import { discountPct, deliveryFeeFor } from "@/lib/shop-utils";

interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  createdAt: string;
}

function Gallery({ images, name }: { images: string[]; name: string }) {
  const [i, setI] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const list = images.length ? images : [];

  function onScroll() {
    const el = stripRef.current;
    if (el) setI(Math.round(el.scrollLeft / el.clientWidth));
  }
  function go(n: number) {
    const k = (n + list.length) % list.length;
    setI(k);
    const el = stripRef.current;
    if (el) el.scrollTo({ left: k * el.clientWidth, behavior: "smooth" });
  }

  if (!list.length) {
    return (
      <div className="aspect-square rounded-xl flex items-center justify-center text-sm" style={{ background: C.soft, color: C.muted }}>
        Pa gen foto
      </div>
    );
  }

  return (
    <div className="md:flex md:gap-3">
      {list.length > 1 && (
        <div className="hidden md:flex md:flex-col gap-2 w-16 shrink-0">
          {list.map((src, k) => (
            <button
              key={src + k}
              onClick={() => go(k)}
              aria-label={`Foto ${k + 1}`}
              className="aspect-square rounded-lg overflow-hidden border-2"
              style={{ borderColor: k === i ? C.ink : "transparent" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
      <div className="relative flex-1 min-w-0">
        {/* Telefòn: glise; Òdinatè: zoom sou souri */}
        <div
          ref={stripRef}
          onScroll={onScroll}
          className="flex overflow-x-auto snap-x snap-mandatory rounded-xl [scrollbar-width:none]"
          style={{ background: C.soft }}
          onMouseMove={(e) => {
            if (window.matchMedia("(hover: none)").matches) return;
            const r = e.currentTarget.getBoundingClientRect();
            setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
          }}
          onMouseLeave={() => setZoom(null)}
        >
          {list.map((src, k) => (
            <div key={src + k} className="snap-center shrink-0 w-full aspect-square overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={k === 0 ? name : ""}
                className="w-full h-full object-cover transition-transform duration-100"
                style={k === i && zoom ? { transform: "scale(2)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
                draggable={false}
              />
            </div>
          ))}
        </div>
        {list.length > 1 && (
          <>
            <button onClick={() => go(i - 1)} aria-label="Anvan" className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow items-center justify-center">
              <ChevronLeft size={20} />
            </button>
            <button onClick={() => go(i + 1)} aria-label="Apre" className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow items-center justify-center">
              <ChevronRight size={20} />
            </button>
            <div className="md:hidden absolute bottom-3 inset-x-0 flex justify-center gap-1.5">
              {list.map((_, k) => (
                <span key={k} className="w-1.5 h-1.5 rounded-full" style={{ background: k === i ? C.ink : "rgba(0,0,0,.25)" }} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function NotifySheet({ productId, productName, onClose }: { productId: string; productName: string; onClose: () => void }) {
  const { shop } = useShop();
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const res = await fetch(`/api/shop/${shop.slug}/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, phone }),
      });
      if (res.ok) setDone(true);
      else setErr((await res.json().catch(() => ({}))).error || "Pa ka anrejistre. Eseye ankò.");
    } catch {
      setErr("Pa gen koneksyon. Eseye ankò.");
    }
    setBusy(false);
  }

  return (
    <Sheet title="Notifye m lè l tounen" onClose={onClose}>
      <div className="p-5">
        {done ? (
          <div className="text-center py-6">
            <Check size={36} className="mx-auto mb-2" style={{ color: C.ok }} />
            <p className="font-bold mb-1">Nou anrejistre w</p>
            <p className="text-sm" style={{ color: C.muted }}>
              Nou pral kontakte w lè {productName} disponib ankò.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <p className="text-sm" style={{ color: C.muted }}>
              Bay nou nimewo telefòn ou (WhatsApp si posib) epi nou pral kontakte w lè {productName} disponib.
            </p>
            <input className={field} style={{ borderColor: C.line }} type="tel" inputMode="tel" required placeholder="Nimewo telefòn" value={phone} onChange={(e) => setPhone(e.target.value)} />
            {err && <p className="text-sm" style={{ color: C.red }}>{err}</p>}
            <button disabled={busy} className="w-full rounded-lg py-3 font-bold text-white disabled:opacity-60" style={{ background: C.ink }}>
              {busy ? "Ap voye..." : "Notifye m"}
            </button>
          </form>
        )}
      </div>
    </Sheet>
  );
}

function Reviews({ productId, ratingCount, rating }: { productId: string; ratingCount: number; rating: number }) {
  const { shop, refresh } = useShop();
  const [list, setList] = useState<Review[] | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", phone: "", rating: 0, comment: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/shop/${shop.slug}/reviews?productId=${productId}`, { cache: "no-store" });
      if (res.ok) setList((await res.json()).reviews);
      else setList([]);
    } catch {
      setList([]);
    }
  }, [shop.slug, productId]);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.rating) {
      setMsg({ ok: false, text: "Chwazi yon nòt ant 1 ak 5 etwal." });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/shop/${shop.slug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, ...form }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMsg({ ok: true, text: "Mèsi pou avi w!" });
        setOpen(false);
        setForm({ name: "", code: "", phone: "", rating: 0, comment: "" });
        await Promise.all([load(), refresh()]);
      } else {
        setMsg({ ok: false, text: data.error || "Pa ka voye avi a. Eseye ankò." });
      }
    } catch {
      setMsg({ ok: false, text: "Pa gen koneksyon. Eseye ankò." });
    }
    setBusy(false);
  }

  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, c: (list ?? []).filter((r) => r.rating === n).length }));
  const total = list?.length ?? 0;

  return (
    <section id="avi" className="scroll-mt-40 mt-12 border-t pt-8" style={{ borderColor: C.line }}>
      <h2 className="text-xl font-bold mb-4">Avi kliyan yo</h2>
      <div className="grid md:grid-cols-[16rem_1fr] gap-8">
        <div>
          {ratingCount > 0 ? (
            <>
              <p className="flex items-end gap-2">
                <span className="text-5xl font-extrabold leading-none">{rating.toFixed(1)}</span>
                <span className="pb-1 text-sm" style={{ color: C.muted }}>sou 5</span>
              </p>
              <div className="mt-2"><Stars value={rating} size={18} /></div>
              <p className="text-sm mt-1" style={{ color: C.muted }}>{ratingCount} avi</p>
              <ul className="mt-4 space-y-1.5">
                {dist.map((d) => (
                  <li key={d.n} className="flex items-center gap-2 text-xs">
                    <span className="w-8">{d.n} ★</span>
                    <span className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: C.soft }}>
                      <span className="block h-full" style={{ width: total ? `${(d.c / total) * 100}%` : 0, background: C.star }} />
                    </span>
                    <span className="w-5 text-right" style={{ color: C.muted }}>{d.c}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm" style={{ color: C.muted }}>Poko gen avi pou pwodwi sa a.</p>
          )}
          <button onClick={() => setOpen((v) => !v)} className="mt-5 w-full rounded-lg border-2 py-2.5 text-sm font-bold" style={{ borderColor: C.ink }}>
            Bay yon avi
          </button>
          {msg?.ok && <p className="text-sm mt-2 font-semibold" style={{ color: C.ok }}>{msg.text}</p>}
        </div>

        <div>
          {open && (
            <form onSubmit={submit} className="rounded-xl border p-4 mb-6 space-y-3" style={{ borderColor: C.line }}>
              <p className="text-sm" style={{ color: C.muted }}>
                Pou evite fo avi, antre kòd kòmand ou (egzanp ABC123) ak nimewo telefòn ou te itilize a. Ou ka bay avi apre w fin resevwa ak peye kòmand lan.
              </p>
              <StarInput value={form.rating} onChange={(n) => setForm({ ...form, rating: n })} />
              <div className="grid sm:grid-cols-2 gap-3">
                <input className={field} style={{ borderColor: C.line }} required placeholder="Non ou" maxLength={40} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <input className={field} style={{ borderColor: C.line }} required placeholder="Kòd kòmand" maxLength={12} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
              </div>
              <input className={field} style={{ borderColor: C.line }} required type="tel" inputMode="tel" placeholder="Telefòn kòmand lan" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <textarea className={field} style={{ borderColor: C.line }} rows={3} maxLength={500} placeholder="Ki jan pwodwi a ye? (opsyonèl)" value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} />
              {msg && !msg.ok && <p className="text-sm" style={{ color: C.red }}>{msg.text}</p>}
              <button disabled={busy} className="rounded-lg px-6 py-3 font-bold text-white disabled:opacity-60" style={{ background: C.ink }}>
                {busy ? "Ap voye..." : "Voye avi a"}
              </button>
            </form>
          )}
          {list === null ? (
            <Loader2 className="animate-spin" size={20} />
          ) : list.length === 0 ? null : (
            <ul className="divide-y" style={{ borderColor: C.line }}>
              {list.map((r) => (
                <li key={r.id} className="py-4" style={{ borderColor: C.line }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Stars value={r.rating} size={14} />
                    <span className="text-sm font-semibold">{r.name}</span>
                    <span className="text-xs font-semibold inline-flex items-center gap-0.5" style={{ color: C.ok }}>
                      <Check size={12} /> Achte verifye
                    </span>
                  </div>
                  <p className="text-xs mb-1" style={{ color: C.muted }}>
                    {new Date(r.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                  {r.comment && <p className="text-sm whitespace-pre-line">{r.comment}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

export function ProductView({ id }: { id: string }) {
  const { shop, base, money, byId, addToCart, setCartOpen, wishlist, toggleWish, pushRecent, recent, qtyInCart, hydrated, showToast } = useShop();
  const router = useRouter();
  const p = byId.get(id);
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [qty, setQty] = useState(1);
  const [notify, setNotify] = useState(false);
  const [optErr, setOptErr] = useState("");

  useEffect(() => {
    pushRecent(id);
  }, [id, pushRecent]);

  const related = useMemo(() => {
    if (!p) return [];
    return shop.products.filter((x) => x.id !== p.id && x.stock > 0 && (x.category === p.category || (p.brand && x.brand === p.brand))).slice(0, 12);
  }, [shop.products, p]);
  const seen = useMemo(() => recent.filter((r) => r !== id).map((r) => byId.get(r)).filter((x): x is NonNullable<typeof x> => !!x).slice(0, 10), [recent, id, byId]);

  if (!p) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-24 text-center">
        <p className="text-xl font-bold mb-2">Pwodwi sa a pa disponib ankò</p>
        <Link href={base} className="inline-block mt-4 rounded-lg px-6 py-3 font-semibold text-white" style={{ background: C.ink }}>
          Wè lòt pwodwi
        </Link>
      </main>
    );
  }

  const out = p.stock <= 0;
  const pct = discountPct(p.price, p.oldPrice);
  const room = Math.max(0, p.stock - (hydrated ? qtyInCart(p.id) : 0));
  const wished = hydrated && wishlist.includes(p.id);
  const fee = deliveryFeeFor(shop, p.price * qty, "delivery");

  function check(): boolean {
    if (p!.sizes.length && !size) {
      setOptErr("Chwazi yon gwosè.");
      showToast("Chwazi yon gwosè.");
      return false;
    }
    if (p!.colors.length && !color) {
      setOptErr("Chwazi yon koulè.");
      showToast("Chwazi yon koulè.");
      return false;
    }
    setOptErr("");
    return true;
  }
  function add(goCheckout: boolean) {
    if (!check()) return;
    if (!addToCart(p!, qty, { size, color })) return;
    if (goCheckout) router.push(`${base}/peman`);
    else setCartOpen(true);
  }
  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: p!.name, url });
      else {
        await navigator.clipboard.writeText(url);
        showToast("Lyen an kopye.");
      }
    } catch {
      /* itilizatè anile */
    }
  }

  const optBtn = (active: boolean) =>
    `min-w-[3rem] px-3.5 py-2 rounded-lg border-2 text-sm font-semibold ${active ? "text-white" : ""}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    image: p.images,
    description: p.description ?? undefined,
    brand: p.brand ? { "@type": "Brand", name: p.brand } : undefined,
    aggregateRating: p.ratingCount ? { "@type": "AggregateRating", ratingValue: p.rating, reviewCount: p.ratingCount } : undefined,
    offers: { "@type": "Offer", priceCurrency: shop.currency, price: p.price, availability: out ? "https://schema.org/OutOfStock" : "https://schema.org/InStock" },
  };

  return (
    <main className="max-w-7xl mx-auto px-4 pt-4 pb-28 md:pb-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <nav className="text-xs mb-4 flex flex-wrap gap-1.5" style={{ color: C.muted }} aria-label="Chemen">
        <Link href={base} className="hover:underline">Akèy</Link>/
        <Link href={`${base}?cat=${encodeURIComponent(p.category)}`} className="hover:underline">{p.category}</Link>/
        <span className="truncate max-w-[16rem]" style={{ color: C.ink }}>{p.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        <Gallery images={p.images} name={p.name} />

        <div>
          {p.brand && (
            <Link href={`${base}?brand=${encodeURIComponent(p.brand)}`} className="text-sm font-semibold hover:underline" style={{ color: C.red }}>
              {p.brand}
            </Link>
          )}
          <h1 className="text-2xl sm:text-3xl font-bold leading-tight mt-0.5">{p.name}</h1>
          <a href="#avi" className="mt-2 inline-flex items-center gap-2 text-sm">
            <Stars value={p.rating} size={16} />
            <span style={{ color: C.muted }}>{p.ratingCount > 0 ? `${p.rating.toFixed(1)} · ${p.ratingCount} avi` : "Poko gen avi"}</span>
          </a>

          <div className="mt-4 pb-4 border-b" style={{ borderColor: C.line }}>
            <PriceBlock price={p.price} oldPrice={p.oldPrice} money={money} big />
            {pct > 0 && (
              <p className="text-sm mt-1 font-semibold" style={{ color: C.red }}>
                Ou ekonomize {pct}% ({money((p.oldPrice ?? 0) - p.price)})
              </p>
            )}
            {p.unit && <p className="text-xs mt-1" style={{ color: C.muted }}>pou chak {p.unit.toLowerCase()}</p>}
          </div>

          <p className="mt-4 text-sm font-semibold" style={{ color: out ? C.red : p.stock <= 5 ? "#B45309" : C.ok }}>
            {out ? "Fini nan stok" : p.stock <= 5 ? `Sèlman ${p.stock} ki rete` : "Disponib"}
          </p>

          {!out && p.colors.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-semibold mb-2">Koulè: <span className="font-normal">{color}</span></p>
              <div className="flex flex-wrap gap-2">
                {p.colors.map((c) => (
                  <button key={c} onClick={() => { setColor(c); setOptErr(""); }} aria-pressed={color === c} className={optBtn(color === c)} style={{ borderColor: C.ink, background: color === c ? C.ink : "#fff" }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}
          {!out && p.sizes.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-semibold mb-2">Gwosè: <span className="font-normal">{size}</span></p>
              <div className="flex flex-wrap gap-2">
                {p.sizes.map((s) => (
                  <button key={s} onClick={() => { setSize(s); setOptErr(""); }} aria-pressed={size === s} className={optBtn(size === s)} style={{ borderColor: C.ink, background: size === s ? C.ink : "#fff" }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {optErr && <p className="mt-2 text-sm font-semibold" style={{ color: C.red }}>{optErr}</p>}

          {!out ? (
            <div className="mt-5 space-y-3">
              <div className="flex items-center gap-3">
                <span className="flex items-center rounded-lg border-2" style={{ borderColor: C.ink }}>
                  <button aria-label="Mwens" onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-11 h-11 flex items-center justify-center"><Minus size={16} /></button>
                  <span className="w-10 text-center font-bold tabular-nums">{qty}</span>
                  <button aria-label="Plis" onClick={() => setQty((q) => Math.min(Math.max(1, room), q + 1))} className="w-11 h-11 flex items-center justify-center"><Plus size={16} /></button>
                </span>
                <button onClick={() => toggleWish(p.id)} aria-pressed={wished} aria-label="Lis anvi" className="w-12 h-12 rounded-lg border-2 flex items-center justify-center" style={{ borderColor: C.line }}>
                  <Heart size={20} color={wished ? C.red : C.ink} fill={wished ? C.red : "none"} />
                </button>
                <button onClick={share} aria-label="Pataje" className="w-12 h-12 rounded-lg border-2 flex items-center justify-center" style={{ borderColor: C.line }}>
                  <Share2 size={19} />
                </button>
              </div>
              {room === 0 && <p className="text-sm" style={{ color: C.muted }}>Ou deja gen tout stok ki disponib nan panye a.</p>}
              <div className="grid sm:grid-cols-2 gap-3">
                <button onClick={() => add(false)} disabled={room === 0} className="rounded-lg py-3.5 font-bold border-2 disabled:opacity-40" style={{ borderColor: C.ink }}>
                  Ajoute nan panye
                </button>
                <button onClick={() => add(true)} disabled={room === 0} className="rounded-lg py-3.5 font-bold text-white disabled:opacity-40" style={{ background: C.red }}>
                  Achte kounye a
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setNotify(true)} className="mt-5 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3.5 font-bold text-white" style={{ background: C.ink }}>
              <Bell size={18} /> Notifye m lè l tounen
            </button>
          )}

          <ul className="mt-6 rounded-xl border divide-y text-sm" style={{ borderColor: C.line }}>
            <li className="flex gap-3 p-3.5" style={{ borderColor: C.line }}>
              <Truck size={20} className="shrink-0 mt-0.5" style={{ color: C.red }} />
              <span>
                <b>Livrezon</b>
                <br />
                <span style={{ color: C.muted }}>
                  {fee > 0 ? `${money(fee)} pou kòmand sa a` : shop.freeDeliveryMin > 0 || shop.deliveryFee === 0 ? "Livrezon gratis" : "Livrezon disponib"}
                  {shop.freeDeliveryMin > 0 && fee > 0 ? ` · gratis depi ${money(shop.freeDeliveryMin)}` : ""}
                </span>
              </span>
            </li>
            {shop.pickup && (
              <li className="flex gap-3 p-3.5" style={{ borderColor: C.line }}>
                <Store size={20} className="shrink-0 mt-0.5" style={{ color: C.red }} />
                <span>
                  <b>Ranmase nan boutik la</b>
                  <br />
                  <span style={{ color: C.muted }}>Gratis{shop.address ? ` · ${shop.address}` : ""}</span>
                </span>
              </li>
            )}
            {shop.returns && (
              <li className="flex gap-3 p-3.5" style={{ borderColor: C.line }}>
                <RotateCcw size={20} className="shrink-0 mt-0.5" style={{ color: C.red }} />
                <span>
                  <b>Retou ak garanti</b>
                  <br />
                  <span className="whitespace-pre-line" style={{ color: C.muted }}>{shop.returns}</span>
                </span>
              </li>
            )}
          </ul>

          {p.description && (
            <div className="mt-6">
              <h2 className="font-bold mb-1.5">Deskripsyon</h2>
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "#333" }}>{p.description}</p>
            </div>
          )}
        </div>
      </div>

      <Reviews productId={p.id} rating={p.rating} ratingCount={p.ratingCount} />

      <div className="mt-12">
        <ProductRow title="Ou ka renmen tou" products={related} href={`${base}?cat=${encodeURIComponent(p.category)}`} />
        <ProductRow title="Ou te gade dènyèman" products={seen} />
      </div>

      {/* Bann fiks sou telefòn */}
      {!out && (
        <div className="md:hidden fixed inset-x-0 bottom-[calc(3.75rem+env(safe-area-inset-bottom))] z-30 bg-white border-t px-4 py-2.5 flex items-center gap-3" style={{ borderColor: C.line }}>
          <div className="min-w-0 flex-1"><PriceBlock price={p.price} oldPrice={p.oldPrice} money={money} /></div>
          <button onClick={() => add(false)} disabled={room === 0} className="rounded-lg px-5 py-3 font-bold text-white disabled:opacity-40" style={{ background: C.red }}>
            Ajoute nan panye
          </button>
        </div>
      )}

      {notify && <NotifySheet productId={p.id} productName={p.name} onClose={() => setNotify(false)} />}
    </main>
  );
}
