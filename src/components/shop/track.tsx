"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, Loader2, MessageCircle, Package, Star, X } from "lucide-react";
import { useShop } from "./shop-context";
import { C, FULFILLMENT_STEPS, fieldClass, fieldStyle } from "./ui";

interface TrackOrder {
  code: string;
  createdAt: string;
  status: "pending" | "partial" | "paid" | "cancelled";
  fulfillment: "new" | "confirmed" | "preparing" | "shipped" | "delivered" | "cancelled";
  fulfillmentNote: string | null;
  deliveryMethod: "delivery" | "pickup";
  paymentLabel: string;
  paymentMethod: string;
  items: { productId: string; name: string; qty: number; unitPrice: number; unit: string; variant?: string }[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  paid: number;
  balance: number;
  currency: string;
}

export function Track() {
  const { shop, base, money, orders } = useShop();
  const sp = useSearchParams();
  const [code, setCode] = useState(sp.get("code") ?? "");
  const [phone, setPhone] = useState(sp.get("phone") ?? "");
  const [order, setOrder] = useState<TrackOrder | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isNewOrder = sp.get("new") === "1";

  const lookup = useCallback(
    async (c: string, ph: string) => {
      setBusy(true);
      setError(null);
      try {
        const res = await fetch(`/api/shop/${shop.slug}/track?code=${encodeURIComponent(c)}&phone=${encodeURIComponent(ph)}`, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setOrder(null);
          setError(data.error || "Pa ka chèche kòmand lan.");
        } else setOrder(data.order);
      } catch {
        setError("Erè rezo — eseye ankò.");
      }
      setBusy(false);
    },
    [shop.slug]
  );

  // Ouvèti otomatik si kòd + telefòn nan URL la (apre yon kòmand)
  useEffect(() => {
    const c = sp.get("code");
    const ph = sp.get("phone");
    if (c && ph) lookup(c, ph);
  }, [sp, lookup]);

  // Rafrechi chak 30s pandan paj la louvri (kliyan an wè chanjman etap yo)
  useEffect(() => {
    if (!order || order.fulfillment === "delivered" || order.fulfillment === "cancelled") return;
    const t = setInterval(() => lookup(order.code, phone || sp.get("phone") || ""), 30000);
    return () => clearInterval(t);
  }, [order, phone, sp, lookup]);

  const waLink = shop.whatsapp && order
    ? `https://wa.me/${shop.whatsapp}?text=${encodeURIComponent(`Bonjou ${shop.name}, mwen vle nouvèl kòmand #${order.code}.`)}`
    : null;

  return (
    <main className="max-w-3xl mx-auto px-4 py-6 pb-16">
      {isNewOrder && order && (
        <div className="rounded-2xl p-5 mb-6 text-center text-white" style={{ background: C.ink }}>
          <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ background: C.ok }}><Check size={30} /></div>
          <h1 className="text-2xl font-bold">Kòmand lan voye!</h1>
          <p className="text-sm opacity-80 mt-1">Nimewo kòmand ou</p>
          <p className="text-4xl font-bold tabular-nums my-1">#{order.code}</p>
          <p className="text-sm opacity-80">Kenbe kòd sa a pou swiv kòmand lan. {shop.name} ap kontakte w pou konfime l{order.paymentMethod !== "cash_delivery" ? " ak peman an" : ""}.</p>
          {order.paymentMethod !== "cash_delivery" && shop.paymentInfo && (
            <p className="mt-3 text-sm rounded-xl bg-white/10 px-4 py-3 whitespace-pre-line text-left">{shop.paymentInfo}</p>
          )}
        </div>
      )}

      {!isNewOrder && <h1 className="text-2xl font-bold mb-4">Swiv kòmand mwen</h1>}

      {!order && (
        <>
          <form
            onSubmit={(e) => { e.preventDefault(); lookup(code, phone); }}
            className="rounded-2xl border p-5 space-y-3 bg-white"
            style={{ borderColor: C.line }}
          >
            <input className={fieldClass} style={fieldStyle} placeholder="Kòd kòmand (ekz: A1B2C3)" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required />
            <input className={fieldClass} style={fieldStyle} placeholder="Telefòn ou itilize a" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            <button disabled={busy} className="w-full min-h-[52px] rounded-xl font-bold text-white disabled:opacity-60 flex items-center justify-center gap-2" style={{ background: C.ink }}>
              {busy ? <Loader2 size={18} className="animate-spin" /> : <Package size={18} />} Chèche kòmand lan
            </button>
            {error && <p className="text-sm text-center font-medium" style={{ color: C.red }}>{error}</p>}
          </form>

          {orders.length > 0 && (
            <div className="mt-6">
              <h2 className="font-bold mb-2">Kòmand ou yo sou aparèy sa a</h2>
              <ul className="space-y-2">
                {orders.map((o) => (
                  <li key={o.code}>
                    <button onClick={() => { setCode(o.code); setPhone(o.phone); lookup(o.code, o.phone); }} className="w-full flex items-center justify-between rounded-xl border px-4 py-3 text-left" style={{ borderColor: C.line }}>
                      <span><b>#{o.code}</b> <span className="text-xs" style={{ color: C.muted }}>· {new Date(o.at).toLocaleDateString("fr-FR")}</span></span>
                      <span className="text-sm font-bold tabular-nums">{money(o.total)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {busy && order && <div className="flex justify-center py-2"><Loader2 className="animate-spin" size={18} /></div>}

      {order && (
        <div className="space-y-5">
          {!isNewOrder && (
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Kòmand #{order.code}</h2>
              <button onClick={() => { setOrder(null); setError(null); }} className="text-sm underline underline-offset-2" style={{ color: C.muted }}>Chèche yon lòt</button>
            </div>
          )}

          <Timeline order={order} />

          {order.fulfillmentNote && order.fulfillment !== "cancelled" && (
            <p className="rounded-xl px-4 py-3 text-sm" style={{ background: C.soft }}>💬 {order.fulfillmentNote}</p>
          )}

          <section className="rounded-2xl border bg-white" style={{ borderColor: C.line }}>
            <div className="divide-y" style={{ borderColor: C.line }}>
              {order.items.map((i, n) => (
                <div key={`${i.productId}-${n}`} className="flex items-center justify-between gap-3 px-4 py-3 text-sm" style={{ borderColor: C.line }}>
                  <div className="min-w-0">
                    <Link href={`${base}/p/${i.productId}`} className="font-medium underline-offset-2 hover:underline">{i.qty}{i.unit ? ` ${i.unit}` : ""} × {i.name}{i.variant ? ` (${i.variant})` : ""}</Link>
                    {order.fulfillment === "delivered" && (
                      <Link href={`${base}/p/${i.productId}?code=${order.code}&phone=${encodeURIComponent(phone || sp.get("phone") || "")}#avi`} className="mt-0.5 flex items-center gap-1 text-xs font-semibold" style={{ color: C.red }}>
                        <Star size={12} /> Bay yon avi
                      </Link>
                    )}
                  </div>
                  <span className="font-bold tabular-nums shrink-0">{money(i.qty * i.unitPrice)}</span>
                </div>
              ))}
            </div>
            <dl className="px-4 py-3 space-y-1 text-sm border-t" style={{ borderColor: C.line }}>
              <Line label="Sou-total" value={money(order.subtotal)} />
              {order.discount > 0 && <Line label="Rabè" value={`- ${money(order.discount)}`} />}
              <Line label={order.deliveryMethod === "pickup" ? "Ranmase" : "Livrezon"} value={order.shipping > 0 ? money(order.shipping) : "Gratis"} />
              <div className="flex justify-between text-base font-bold pt-2"><dt>Total</dt><dd className="tabular-nums">{money(order.total)}</dd></div>
            </dl>
            <div className="px-4 py-3 border-t text-sm flex flex-wrap items-center justify-between gap-2" style={{ borderColor: C.line }}>
              <span>Peman: <b>{order.paymentLabel}</b></span>
              <span className="rounded-full px-3 py-1 text-xs font-bold" style={order.status === "paid" ? { background: "#ECFDF3", color: C.ok } : order.status === "partial" ? { background: "#FEF3C7", color: "#92400E" } : { background: C.soft }}>
                {order.status === "paid" ? "Peye" : order.status === "partial" ? `Peye ${money(order.paid)} · rete ${money(order.balance)}` : order.status === "cancelled" ? "Anile" : "Poko peye"}
              </span>
            </div>
          </section>

          <div className="flex flex-col sm:flex-row gap-3">
            {waLink && (
              <a href={waLink} target="_blank" rel="noreferrer" className="flex-1 min-h-[50px] rounded-xl font-bold text-white flex items-center justify-center gap-2" style={{ background: C.ink }}>
                <MessageCircle size={18} /> Kontakte boutik la
              </a>
            )}
            <Link href={base} className="flex-1 min-h-[50px] rounded-xl border-2 font-bold flex items-center justify-center" style={{ borderColor: C.ink }}>Kontinye achte</Link>
          </div>
        </div>
      )}
    </main>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><dt>{label}</dt><dd className="tabular-nums font-medium">{value}</dd></div>;
}

function Timeline({ order }: { order: TrackOrder }) {
  if (order.fulfillment === "cancelled") {
    return (
      <div className="rounded-2xl px-5 py-4 flex items-center gap-3 text-white" style={{ background: C.red }}>
        <X size={22} /> <p className="font-semibold">Kòmand sa a anile.</p>
      </div>
    );
  }
  const pickup = order.deliveryMethod === "pickup";
  const current = Math.max(0, FULFILLMENT_STEPS.findIndex((s) => s.id === order.fulfillment));
  return (
    <ol className="rounded-2xl border bg-white p-5 space-y-0" style={{ borderColor: C.line }}>
      {FULFILLMENT_STEPS.map((s, i) => {
        const done = i <= current;
        const label = pickup && "labelPickup" in s ? s.labelPickup : s.label;
        return (
          <li key={s.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="w-7 h-7 rounded-full flex items-center justify-center text-white shrink-0" style={{ background: done ? (i === current ? C.red : C.ink) : C.line }}>
                {done ? <Check size={15} /> : <span className="text-xs font-bold" style={{ color: C.muted }}>{i + 1}</span>}
              </span>
              {i < FULFILLMENT_STEPS.length - 1 && <span className="w-0.5 flex-1 min-h-[22px]" style={{ background: i < current ? C.ink : C.line }} />}
            </div>
            <p className={`pb-4 pt-0.5 text-sm ${i === current ? "font-bold" : done ? "font-medium" : ""}`} style={{ color: done ? C.ink : C.muted }}>{label}</p>
          </li>
        );
      })}
    </ol>
  );
}
