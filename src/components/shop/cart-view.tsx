"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useShop } from "./shop-provider";
import { C, clamp2 } from "./ui";
import { deliveryFeeFor, variantLabel } from "@/lib/shop-utils";

export function CartView() {
  const { shop, base, money, cartLines, subtotal, setLineQty, removeLine, clearCart, hydrated, itemCount } = useShop();
  const fee = deliveryFeeFor(shop, subtotal, "delivery");
  const toFree = shop.freeDeliveryMin > 0 ? Math.max(0, shop.freeDeliveryMin - subtotal) : 0;

  if (!hydrated) return <main className="max-w-5xl mx-auto px-4 py-20" />;

  if (cartLines.length === 0) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-24 text-center">
        <ShoppingCart size={44} className="mx-auto mb-4" style={{ color: C.line }} />
        <h1 className="text-2xl font-bold mb-1">Panye ou vid</h1>
        <p className="mb-6" style={{ color: C.muted }}>Chwazi kèk pwodwi pou kòmanse.</p>
        <Link href={base} className="inline-block rounded-lg px-7 py-3.5 font-bold text-white" style={{ background: C.ink }}>
          Wè pwodwi yo
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-end justify-between mb-5">
        <h1 className="text-2xl font-bold">Panye ({itemCount})</h1>
        <button onClick={() => window.confirm("Vide panye a?") && clearCart()} className="text-sm underline" style={{ color: C.muted }}>
          Vide panye a
        </button>
      </div>
      <div className="lg:grid lg:grid-cols-[1fr_20rem] lg:gap-8 items-start">
        <ul className="divide-y border-y" style={{ borderColor: C.line }}>
          {cartLines.map((l) => (
            <li key={l.key} className="flex gap-4 py-4" style={{ borderColor: C.line }}>
              <Link href={`${base}/p/${l.p.id}`} className="shrink-0">
                {l.p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={l.p.imageUrl} alt="" className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg object-cover" />
                ) : (
                  <span className="block w-24 h-24 rounded-lg" style={{ background: C.soft }} />
                )}
              </Link>
              <div className="flex-1 min-w-0 flex flex-col">
                <Link href={`${base}/p/${l.p.id}`} className="font-semibold leading-snug hover:underline" style={clamp2}>
                  {l.p.name}
                </Link>
                {(l.size || l.color) && <p className="text-sm" style={{ color: C.muted }}>{variantLabel(l.size, l.color)}</p>}
                <p className="text-sm tabular-nums" style={{ color: C.muted }}>{money(l.p.price)} chak</p>
                <div className="mt-auto pt-2 flex items-center justify-between">
                  <span className="flex items-center rounded-lg border-2" style={{ borderColor: C.ink }}>
                    <button aria-label="Mwens" onClick={() => setLineQty(l.key, l.qty - 1)} className="w-10 h-10 flex items-center justify-center"><Minus size={15} /></button>
                    <span className="w-9 text-center font-bold tabular-nums">{l.qty}</span>
                    <button aria-label="Plis" onClick={() => setLineQty(l.key, l.qty + 1)} disabled={l.qty >= l.p.stock} className="w-10 h-10 flex items-center justify-center disabled:opacity-30"><Plus size={15} /></button>
                  </span>
                  <span className="font-bold text-lg tabular-nums">{money(l.p.price * l.qty)}</span>
                </div>
              </div>
              <button aria-label="Retire" onClick={() => removeLine(l.key)} className="self-start p-1.5" style={{ color: C.muted }}>
                <Trash2 size={18} />
              </button>
            </li>
          ))}
        </ul>

        <aside className="mt-6 lg:mt-0 rounded-xl border p-5 lg:sticky lg:top-40" style={{ borderColor: C.line }}>
          <h2 className="font-bold text-lg mb-3">Rezime</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt>Sou-total</dt><dd className="tabular-nums font-semibold">{money(subtotal)}</dd></div>
            <div className="flex justify-between">
              <dt>Livrezon</dt>
              <dd className="tabular-nums font-semibold">{fee > 0 ? money(fee) : "Gratis"}</dd>
            </div>
          </dl>
          {toFree > 0 && (
            <p className="text-xs mt-3 rounded-lg p-2.5" style={{ background: C.soft }}>
              Ajoute <b>{money(toFree)}</b> pou jwenn livrezon gratis.
            </p>
          )}
          <div className="flex justify-between font-bold text-xl border-t mt-4 pt-4" style={{ borderColor: C.line }}>
            <span>Total</span>
            <span className="tabular-nums">{money(subtotal + fee)}</span>
          </div>
          <Link href={`${base}/peman`} className="mt-4 block text-center rounded-lg py-3.5 font-bold text-white" style={{ background: C.red }}>
            Peye kounye a
          </Link>
          <Link href={base} className="mt-2 block text-center rounded-lg py-3 font-semibold border-2" style={{ borderColor: C.ink }}>
            Kontinye achte
          </Link>
        </aside>
      </div>
    </main>
  );
}
