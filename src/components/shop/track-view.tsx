"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { useShop } from "./shop-provider";
import { C, field } from "./ui";
import { FULFILLMENT_LABEL, type Fulfillment } from "@/lib/shop-utils";

interface Tracked {
  code: string;
  createdAt: string;
  status: "pending" | "partial" | "paid" | "cancelled";
  fulfillment: Fulfillment | "cancelled";
  deliveryMethod: "delivery" | "pickup";
  paymentLabel: string;
  address: string | null;
  items: { productId: string; name: string; qty: number; unitPrice: number; variant?: string }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paid: number;
  balance: number;
}

const STEPS: Fulfillment[] = ["new", "preparing", "shipped", "delivered"];

export function TrackView() {
  const { shop, base, money, myOrders } = useShop();
  const sp = useSearchParams();
  const [code, setCode] = useState((sp.get("code") ?? "").toUpperCase());
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [order, setOrder] = useState<Tracked | null>(null);

  async function lookup(c: string, ph: string) {
    setBusy(true);
    setErr("");
    setOrder(null);
    try {
      const res = await fetch(`/api/shop/${shop.slug}/track?code=${encodeURIComponent(c)}&phone=${encodeURIComponent(ph)}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setOrder(data.order);
      else setErr(data.error || "Pa jwenn kòmand.");
    } catch {
      setErr("Pa gen koneksyon. Eseye ankò.");
    }
    setBusy(false);
  }

  // Si kliyan an fèk kòmande sou aparèy sa a, nou ranpli telefòn nan pou li
  useEffect(() => {
    const c = (sp.get("code") ?? "").toUpperCase();
    if (!c) return;
    const known = myOrders.find((o) => o.code === c);
    if (known) {
      setPhone(known.phone);
      lookup(c, known.phone);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myOrders.length]);

  const stepIdx = order && order.fulfillment !== "cancelled" ? STEPS.indexOf(order.fulfillment) : -1;
  const labels: Record<Fulfillment, string> = {
    ...FULFILLMENT_LABEL,
    shipped: order?.deliveryMethod === "pickup" ? "Pare pou ranmase" : "Nan wout",
    delivered: order?.deliveryMethod === "pickup" ? "Ranmase" : "Livre",
  };

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">Swiv kòmand mwen</h1>
      <p className="text-sm mb-5" style={{ color: C.muted }}>Antre kòd kòmand lan ak nimewo telefòn ou te itilize a.</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          lookup(code, phone);
        }}
        className="grid sm:grid-cols-[1fr_1fr_auto] gap-3"
      >
        <input className={field} style={{ borderColor: C.line }} required placeholder="Kòd (ABC123)" maxLength={12} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
        <input className={field} style={{ borderColor: C.line }} required type="tel" inputMode="tel" placeholder="Telefòn" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <button disabled={busy} className="rounded-lg px-6 py-3 font-bold text-white disabled:opacity-60" style={{ background: C.ink }}>
          {busy ? <Loader2 size={18} className="animate-spin mx-auto" /> : "Chèche"}
        </button>
      </form>

      {myOrders.length > 0 && !order && (
        <div className="mt-5">
          <p className="text-sm font-semibold mb-2">Kòmand ou fè sou aparèy sa a</p>
          <div className="flex flex-wrap gap-2">
            {myOrders.map((o) => (
              <button
                key={o.code}
                onClick={() => {
                  setCode(o.code);
                  setPhone(o.phone);
                  lookup(o.code, o.phone);
                }}
                className="rounded-full border px-3.5 py-1.5 text-sm font-semibold"
                style={{ borderColor: C.line }}
              >
                #{o.code} · {new Date(o.at).toLocaleDateString("fr-FR")}
              </button>
            ))}
          </div>
        </div>
      )}

      {err && <p role="alert" className="mt-4 text-sm font-semibold" style={{ color: C.red }}>{err}</p>}

      {order && (
        <section className="mt-8">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-xl font-bold">Kòmand #{order.code}</h2>
            <span className="text-sm" style={{ color: C.muted }}>{new Date(order.createdAt).toLocaleDateString("fr-FR")}</span>
          </div>

          {order.fulfillment === "cancelled" ? (
            <p className="rounded-xl p-4 font-semibold text-white" style={{ background: C.red }}>Kòmand sa a anile.</p>
          ) : (
            <ol className="flex items-start mb-6" aria-label="Eta kòmand lan">
              {STEPS.map((s, i) => {
                const done = i <= stepIdx;
                return (
                  <li key={s} className="flex-1 flex flex-col items-center text-center relative">
                    {i > 0 && <span className="absolute top-4 right-1/2 w-full h-0.5" style={{ background: i <= stepIdx ? C.ink : C.line }} />}
                    <span className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-white" style={{ background: done ? C.ink : "#D4D4D4" }}>
                      {done ? <Check size={16} /> : <span className="text-xs">{i + 1}</span>}
                    </span>
                    <span className="mt-2 text-xs font-semibold leading-tight px-1" style={{ color: done ? C.ink : C.muted }}>{labels[s]}</span>
                  </li>
                );
              })}
            </ol>
          )}

          <div className="rounded-xl border p-5 space-y-4" style={{ borderColor: C.line }}>
            <ul className="space-y-2 text-sm">
              {order.items.map((it, i) => (
                <li key={i} className="flex justify-between gap-3">
                  <span>
                    <Link href={`${base}/p/${it.productId}`} className="hover:underline">{it.qty}× {it.name}{it.variant ? ` (${it.variant})` : ""}</Link>
                    {(order.status === "paid" || order.fulfillment === "delivered") && order.fulfillment !== "cancelled" && (
                      <Link href={`${base}/p/${it.productId}#avi`} className="ml-2 text-xs font-semibold underline" style={{ color: C.red }}>Bay yon avi</Link>
                    )}
                  </span>
                  <span className="tabular-nums">{money(it.qty * it.unitPrice)}</span>
                </li>
              ))}
            </ul>
            <dl className="border-t pt-3 text-sm space-y-1" style={{ borderColor: C.line }}>
              <div className="flex justify-between"><dt>Sou-total</dt><dd className="tabular-nums">{money(order.subtotal)}</dd></div>
              <div className="flex justify-between"><dt>Livrezon</dt><dd className="tabular-nums">{order.deliveryFee > 0 ? money(order.deliveryFee) : "Gratis"}</dd></div>
              <div className="flex justify-between font-bold text-base"><dt>Total</dt><dd className="tabular-nums">{money(order.total)}</dd></div>
              <div className="flex justify-between"><dt>Peye</dt><dd className="tabular-nums">{money(order.paid)}</dd></div>
              {order.balance > 0 && order.fulfillment !== "cancelled" && (
                <div className="flex justify-between font-semibold" style={{ color: C.red }}><dt>Rès pou peye</dt><dd className="tabular-nums">{money(order.balance)}</dd></div>
              )}
            </dl>
            <p className="text-sm" style={{ color: C.muted }}>
              {order.deliveryMethod === "pickup" ? "Ranmase nan boutik la" : `Livrezon: ${order.address ?? ""}`} · Peman: {order.paymentLabel}
            </p>
          </div>
        </section>
      )}
    </main>
  );
}
