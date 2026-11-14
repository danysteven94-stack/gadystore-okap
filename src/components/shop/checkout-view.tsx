"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Loader2, MessageCircle, Store, Truck } from "lucide-react";
import { useShop } from "./shop-provider";
import { C, field } from "./ui";
import { PAY_LABEL, deliveryFeeFor, variantLabel, type DeliveryMethod, type PayMethod } from "@/lib/shop-utils";

interface Placed {
  code: string;
  total: number;
  subtotal: number;
  deliveryFee: number;
  deliveryMethod: DeliveryMethod;
  paymentLabel: string;
  paymentMethod: PayMethod;
  phone: string;
  lines: { name: string; qty: number; unitPrice: number; variant?: string }[];
}

const KEY = (slug: string) => `customer:${slug}`;

export function CheckoutView() {
  const { shop, base, money, cartLines, subtotal, clearCart, rememberOrder, hydrated, refresh } = useShop();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [delivery, setDelivery] = useState<DeliveryMethod>("delivery");
  const [pay, setPay] = useState<PayMethod>("cash_delivery");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [placed, setPlaced] = useState<Placed | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY(shop.slug));
      if (raw) {
        const c = JSON.parse(raw);
        setName(c.name ?? "");
        setPhone(c.phone ?? "");
        setAddress(c.address ?? "");
      }
    } catch {
      /* ignore */
    }
  }, [shop.slug]);

  const fee = deliveryFeeFor(shop, subtotal, delivery);
  const total = subtotal + fee;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setErr("");
    for (const l of cartLines) {
      if (l.p.sizes.length && !l.size) return setErr(`Chwazi gwosè pou ${l.p.name} nan paj pwodwi a.`);
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/shop/${shop.slug}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name,
          phone,
          address: delivery === "delivery" ? address : undefined,
          note: note || undefined,
          paymentMethod: pay,
          deliveryMethod: delivery,
          items: cartLines.map((l) => ({ productId: l.p.id, qty: l.qty, size: l.size || undefined, color: l.color || undefined })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error || "Pa ka voye kòmand lan. Eseye ankò.");
        if (res.status === 409 || res.status === 404) refresh();
      } else {
        try {
          localStorage.setItem(KEY(shop.slug), JSON.stringify({ name, phone, address }));
        } catch {
          /* ignore */
        }
        rememberOrder(data.order.code, phone);
        setPlaced({ ...data.order, phone, paymentMethod: pay });
        clearCart();
        window.scrollTo({ top: 0 });
      }
    } catch {
      setErr("Pa gen koneksyon. Eseye ankò.");
    }
    setBusy(false);
  }

  if (placed) {
    const lines = placed.lines.map((l) => `• ${l.qty}× ${l.name}${l.variant ? ` (${l.variant})` : ""}`).join("\n");
    const wa = shop.whatsapp
      ? `https://wa.me/${shop.whatsapp}?text=${encodeURIComponent(
          `Bonjou! Se ${name}. Mwen fèk fè kòmand #${placed.code}:\n${lines}\nTotal: ${money(placed.total)}\nPeman: ${placed.paymentLabel}`
        )}`
      : null;
    return (
      <main className="max-w-xl mx-auto px-4 py-10">
        <div className="text-center">
          <span className="mx-auto w-14 h-14 rounded-full flex items-center justify-center text-white" style={{ background: C.ok }}>
            <Check size={30} />
          </span>
          <h1 className="text-2xl font-bold mt-4">Kòmand ou resevwa!</h1>
          <p className="mt-1" style={{ color: C.muted }}>Nou pral kontakte w sou {placed.phone} pou konfime.</p>
          <p className="mt-6 text-sm" style={{ color: C.muted }}>Kòd kòmand ou</p>
          <p className="text-4xl font-extrabold tracking-[0.2em] mt-1">{placed.code}</p>
          <p className="text-xs mt-2" style={{ color: C.muted }}>Kenbe kòd sa a. Ou bezwen l ak telefòn ou pou swiv kòmand lan.</p>
        </div>

        <div className="mt-6 rounded-xl border p-5" style={{ borderColor: C.line }}>
          <ul className="space-y-1.5 text-sm">
            {placed.lines.map((l, i) => (
              <li key={i} className="flex justify-between gap-3">
                <span>{l.qty}× {l.name}{l.variant ? ` (${l.variant})` : ""}</span>
                <span className="tabular-nums">{money(l.qty * l.unitPrice)}</span>
              </li>
            ))}
          </ul>
          <div className="border-t mt-3 pt-3 text-sm space-y-1" style={{ borderColor: C.line }}>
            <div className="flex justify-between"><span>Livrezon</span><span className="tabular-nums">{placed.deliveryFee > 0 ? money(placed.deliveryFee) : "Gratis"}</span></div>
            <div className="flex justify-between font-bold text-lg"><span>Total</span><span className="tabular-nums">{money(placed.total)}</span></div>
          </div>
        </div>

        {(placed.paymentMethod === "moncash" || placed.paymentMethod === "natcash" || placed.paymentMethod === "transfer") && (
          <div className="mt-4 rounded-xl p-4 text-sm" style={{ background: C.soft }}>
            <p className="font-bold mb-1">Pou fini peman an ({placed.paymentLabel})</p>
            <p className="whitespace-pre-line">{shop.paymentInfo || "Boutik la pral voye enstriksyon peman yo ba ou."}</p>
            <p className="mt-2" style={{ color: C.muted }}>Mete kòd #{placed.code} nan mesaj peman an.</p>
          </div>
        )}

        <div className="mt-6 grid gap-3">
          {wa && (
            <a href={wa} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg py-3.5 font-bold text-white" style={{ background: "#128C4A" }}>
              <MessageCircle size={18} /> Voye kòmand lan sou WhatsApp
            </a>
          )}
          <Link href={`${base}/swiv?code=${placed.code}`} className="text-center rounded-lg py-3.5 font-bold border-2" style={{ borderColor: C.ink }}>
            Swiv kòmand lan
          </Link>
          <Link href={base} className="text-center py-2 text-sm font-semibold underline">Kontinye achte</Link>
        </div>
      </main>
    );
  }

  if (!hydrated) return <main className="max-w-5xl mx-auto px-4 py-20" />;

  if (cartLines.length === 0) {
    return (
      <main className="max-w-xl mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold mb-2">Panye ou vid</h1>
        <p className="mb-6" style={{ color: C.muted }}>Ajoute pwodwi anvan w peye.</p>
        <Link href={base} className="inline-block rounded-lg px-7 py-3.5 font-bold text-white" style={{ background: C.ink }}>Wè pwodwi yo</Link>
      </main>
    );
  }

  const card = (active: boolean) => `flex items-start gap-3 rounded-xl border-2 p-3.5 cursor-pointer ${active ? "" : ""}`;
  const cardStyle = (active: boolean) => ({ borderColor: active ? C.ink : C.line, background: active ? "#FAFAFA" : "#fff" });

  return (
    <main className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-5">Peye kòmand lan</h1>
      <form onSubmit={submit} className="lg:grid lg:grid-cols-[1fr_22rem] lg:gap-10 items-start">
        <div className="space-y-8">
          <section>
            <h2 className="font-bold text-lg mb-3">Enfòmasyon ou</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <input className={field} style={{ borderColor: C.line }} required minLength={2} placeholder="Non konplè" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
              <input className={field} style={{ borderColor: C.line }} required type="tel" inputMode="tel" placeholder="Telefòn (WhatsApp si posib)" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </section>

          <section>
            <h2 className="font-bold text-lg mb-3">Livrezon</h2>
            <div className="space-y-2.5">
              <label className={card(delivery === "delivery")} style={cardStyle(delivery === "delivery")}>
                <input type="radio" name="delivery" className="mt-1" checked={delivery === "delivery"} onChange={() => setDelivery("delivery")} />
                <Truck size={20} className="mt-0.5 shrink-0" />
                <span className="flex-1">
                  <b>Livrezon lakay</b>
                  <span className="block text-sm" style={{ color: C.muted }}>
                    {deliveryFeeFor(shop, subtotal, "delivery") > 0 ? money(deliveryFeeFor(shop, subtotal, "delivery")) : "Gratis"}
                  </span>
                </span>
              </label>
              {shop.pickup && (
                <label className={card(delivery === "pickup")} style={cardStyle(delivery === "pickup")}>
                  <input type="radio" name="delivery" className="mt-1" checked={delivery === "pickup"} onChange={() => setDelivery("pickup")} />
                  <Store size={20} className="mt-0.5 shrink-0" />
                  <span className="flex-1">
                    <b>Ranmase nan boutik la</b>
                    <span className="block text-sm" style={{ color: C.muted }}>Gratis{shop.address ? ` · ${shop.address}` : ""}</span>
                  </span>
                </label>
              )}
            </div>
            {delivery === "delivery" && (
              <textarea className={`${field} mt-3`} style={{ borderColor: C.line }} required rows={2} minLength={5} maxLength={200} placeholder="Adrès livrezon (vil, katye, ri, pwen repè)" autoComplete="street-address" value={address} onChange={(e) => setAddress(e.target.value)} />
            )}
            <input className={`${field} mt-3`} style={{ borderColor: C.line }} maxLength={300} placeholder="Nòt pou boutik la (opsyonèl)" value={note} onChange={(e) => setNote(e.target.value)} />
          </section>

          <section>
            <h2 className="font-bold text-lg mb-3">Peman</h2>
            <div className="space-y-2.5">
              {(Object.keys(PAY_LABEL) as PayMethod[]).map((m) => (
                <label key={m} className={card(pay === m)} style={cardStyle(pay === m)}>
                  <input type="radio" name="pay" className="mt-1" checked={pay === m} onChange={() => setPay(m)} />
                  <span className="flex-1">
                    <b>{PAY_LABEL[m]}</b>
                    {m === "cash_delivery" && <span className="block text-sm" style={{ color: C.muted }}>{delivery === "pickup" ? "Ou peye lè w vin ranmase." : "Ou peye livrè a lè w resevwa kòmand lan."}</span>}
                    {m !== "cash_delivery" && <span className="block text-sm" style={{ color: C.muted }}>Enstriksyon yo parèt apre ou fin kòmande.</span>}
                  </span>
                </label>
              ))}
            </div>
          </section>
        </div>

        <aside className="mt-8 lg:mt-0 rounded-xl border p-5 lg:sticky lg:top-40" style={{ borderColor: C.line }}>
          <h2 className="font-bold text-lg mb-3">Kòmand ou</h2>
          <ul className="space-y-3 max-h-72 overflow-y-auto">
            {cartLines.map((l) => (
              <li key={l.key} className="flex gap-3 text-sm">
                {l.p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={l.p.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                ) : (
                  <span className="w-12 h-12 rounded-lg shrink-0" style={{ background: C.soft }} />
                )}
                <span className="flex-1 min-w-0">
                  <span className="block truncate">{l.p.name}</span>
                  <span className="block text-xs" style={{ color: C.muted }}>{l.qty} × {money(l.p.price)}{l.size || l.color ? ` · ${variantLabel(l.size, l.color)}` : ""}</span>
                </span>
                <span className="font-semibold tabular-nums">{money(l.p.price * l.qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="border-t mt-4 pt-4 space-y-2 text-sm" style={{ borderColor: C.line }}>
            <div className="flex justify-between"><dt>Sou-total</dt><dd className="tabular-nums">{money(subtotal)}</dd></div>
            <div className="flex justify-between"><dt>Livrezon</dt><dd className="tabular-nums">{fee > 0 ? money(fee) : "Gratis"}</dd></div>
            <div className="flex justify-between font-bold text-xl pt-2"><dt>Total</dt><dd className="tabular-nums">{money(total)}</dd></div>
          </dl>
          {err && <p role="alert" className="mt-3 text-sm font-semibold" style={{ color: C.red }}>{err}</p>}
          <button disabled={busy} className="mt-4 w-full rounded-lg py-4 font-bold text-white disabled:opacity-60 inline-flex items-center justify-center gap-2" style={{ background: C.red }}>
            {busy ? <><Loader2 size={18} className="animate-spin" /> Ap voye...</> : `Konfime kòmand lan · ${money(total)}`}
          </button>
          <p className="text-xs text-center mt-2" style={{ color: C.muted }}>Ou pa peye anyen sou sit la. Boutik la konfime ak ou.</p>
        </aside>
      </form>
    </main>
  );
}
