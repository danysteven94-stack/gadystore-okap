"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Minus, Package, Plus, ShoppingBag, Tag, Trash2, Truck } from "lucide-react";
import { useShop, useT } from "./shop-context";
import { C, fieldClass, fieldStyle } from "./ui";
import { deliveryEta } from "@/lib/delivery-eta";

type PayMethod = "cash_delivery" | "moncash" | "natcash" | "transfer";
type Method = "delivery" | "pickup";

const PAY_OPTIONS: { id: PayMethod; label: string }[] = [
  { id: "cash_delivery", label: "Kach lè m resevwa" },
  { id: "moncash", label: "MonCash" },
  { id: "natcash", label: "NatCash" },
  { id: "transfer", label: "Transfè bank" },
];

interface Quote {
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  freeShipping: boolean;
  couponCode: string | null;
  couponError: string | null;
}

export function Checkout() {
  const t = useT();
  const { shop, base, money, cartLines, subtotal, setLine, clearCart, rememberOrder, customer, rememberCustomer } = useShop();
  const router = useRouter();

  const firstMethod: Method = shop.deliveryEnabled ? "delivery" : "pickup";
  const [method, setMethod] = useState<Method>(firstMethod);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [pay, setPay] = useState<PayMethod>("cash_delivery");
  const [payRef, setPayRef] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [appliedCode, setAppliedCode] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prefilled = useRef(false);

  // Ranpli otomatikman ak enfòmasyon dènye kòmand lan
  useEffect(() => {
    if (customer && !prefilled.current) {
      prefilled.current = true;
      setName(customer.name);
      setPhone(customer.phone);
      setAddress(customer.address);
    }
  }, [customer]);

  const itemsKey = useMemo(() => cartLines.map((l) => `${l.key}:${l.qty}`).join(","), [cartLines]);

  // Sèvè a kalkile total la (rabè + livrezon). Navigatè a pa deside anyen.
  useEffect(() => {
    if (cartLines.length === 0) return;
    let cancelled = false;
    setQuoting(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/shop/${shop.slug}/quote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deliveryMethod: method,
            couponCode: appliedCode || undefined,
            items: cartLines.map((l) => ({ productId: l.p.id, qty: l.qty, size: l.size || undefined, color: l.color || undefined })),
          }),
        });
        const data = await res.json().catch(() => null);
        if (!cancelled && res.ok) setQuote(data);
      } catch {
        /* rete ak kalkil lokal */
      }
      if (!cancelled) setQuoting(false);
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey, method, appliedCode, shop.slug]);

  const eta = deliveryEta(shop.deliveryMinDays, shop.deliveryMaxDays, t);
  const localShipping = method === "pickup" ? 0 : shop.freeShippingMin > 0 && subtotal >= shop.freeShippingMin ? 0 : shop.deliveryFee;
  const view: Quote = quote ?? { subtotal, discount: 0, shipping: localShipping, total: subtotal + localShipping, freeShipping: localShipping === 0, couponCode: null, couponError: null };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || cartLines.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/shop/${shop.slug}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name,
          phone,
          address: method === "delivery" ? address : undefined,
          note: note || undefined,
          paymentMethod: pay,
          paymentRef: pay !== "cash_delivery" && payRef ? payRef : undefined,
          deliveryMethod: method,
          couponCode: view.couponCode ?? undefined,
          items: cartLines.map((l) => ({ productId: l.p.id, qty: l.qty, size: l.size || undefined, color: l.color || undefined })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ? t(data.error) : t("Pa ka voye kòmand lan. Eseye ankò."));
        setBusy(false);
        return;
      }
      rememberOrder({ code: data.order.code, phone, total: data.order.total, at: new Date().toISOString() });
      rememberCustomer({ name, phone, address });
      clearCart();
      router.push(`${base}/track?code=${data.order.code}&phone=${encodeURIComponent(phone)}&new=1`);
    } catch {
      setError(t("Erè rezo — verifye entènèt ou epi eseye ankò."));
      setBusy(false);
    }
  }

  if (cartLines.length === 0) {
    return (
      <main className="max-w-xl mx-auto px-4 py-24 text-center">
        <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: C.soft }}><ShoppingBag size={28} /></div>
        <p className="mb-6" style={{ color: C.muted }}>{t("Panye ou vid.")}</p>
        <Link href={base} className="inline-block rounded-xl px-7 py-3.5 font-semibold text-white" style={{ background: C.ink }}>{t("Gade pwodwi yo")}</Link>
      </main>
    );
  }

  const bothMethods = shop.deliveryEnabled && shop.pickupEnabled;

  return (
    <main className="max-w-5xl mx-auto px-4 py-6 pb-16">
      <h1 className="text-2xl font-bold mb-5">{t("Pase kòmand lan")}</h1>
      <form onSubmit={submit} className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">
        <div className="space-y-5">
          {bothMethods && (
            <Card title={t("1. Kijan ou vle resevwa kòmand lan?")}>
              <div className="grid grid-cols-2 gap-2">
                <Choice active={method === "delivery"} onClick={() => setMethod("delivery")} icon={<Truck size={18} />} title={t("Livrezon")} sub={shop.deliveryFee > 0 ? money(shop.deliveryFee) : t("Gratis")} />
                <Choice active={method === "pickup"} onClick={() => setMethod("pickup")} icon={<Package size={18} />} title={t("Ranmase")} sub={t("Gratis")} />
              </div>
              {method === "delivery" && eta && <p className="mt-3 text-sm font-medium flex items-center gap-2"><Truck size={16} /> {t("Tan livrezon: {eta}", { eta })}</p>}
              {method === "pickup" && shop.address && <p className="mt-3 text-sm" style={{ color: C.muted }}>📍 {shop.address}</p>}
            </Card>
          )}

          <Card title={bothMethods ? t("2. Enfòmasyon ou") : t("Enfòmasyon ou")}>
            <div className="space-y-3">
              <input className={fieldClass} style={fieldStyle} placeholder={t("Non konplè *")} value={name} onChange={(e) => setName(e.target.value)} required minLength={2} autoComplete="name" />
              <input className={fieldClass} style={fieldStyle} placeholder={t("Telefòn / WhatsApp *")} inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required autoComplete="tel" />
              {method === "delivery" && (
                <input className={fieldClass} style={fieldStyle} placeholder={t("Adrès livrezon * (ri, katye, vil)")} value={address} onChange={(e) => setAddress(e.target.value)} required minLength={5} autoComplete="street-address" />
              )}
              <textarea className={fieldClass} style={fieldStyle} placeholder={t("Nòt pou boutik la (opsyonèl)")} rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} />
            </div>
          </Card>

          <Card title={bothMethods ? t("3. Peman") : t("Peman")}>
            <div className="grid grid-cols-2 gap-2">
              {PAY_OPTIONS.map((o) => (
                <button type="button" key={o.id} onClick={() => setPay(o.id)} className="rounded-xl border py-3 text-sm font-semibold" style={pay === o.id ? { background: C.ink, color: "#fff", borderColor: C.ink } : { background: "#fff", borderColor: C.line }}>
                  {t(o.label)}
                </button>
              ))}
            </div>
            {pay !== "cash_delivery" && (
              <div className="mt-3 space-y-3">
                <p className="text-sm rounded-xl px-3.5 py-3 whitespace-pre-line" style={{ background: C.soft }}>
                  {shop.paymentInfo || t("Boutik la ap kontakte w ak enstriksyon peman an apre kòmand lan.")}
                </p>
                <input className={fieldClass} style={fieldStyle} placeholder={t("Nimewo tranzaksyon (si ou deja peye)")} value={payRef} onChange={(e) => setPayRef(e.target.value)} maxLength={60} />
              </div>
            )}
          </Card>
        </div>

        {/* ---------- Rezime ---------- */}
        <aside className="rounded-2xl border p-5 lg:sticky lg:top-32 bg-white" style={{ borderColor: C.line }}>
          <h2 className="font-bold text-lg mb-3">{t("Rezime")}</h2>
          <div className="divide-y mb-4" style={{ borderColor: C.line }}>
            {cartLines.map(({ key, p, qty, size, color }) => (
              <div key={key} className="flex items-center gap-3 py-3" style={{ borderColor: C.line }}>
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imageUrl} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-lg shrink-0" style={{ background: C.soft }} />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  {(size || color) && <p className="text-xs" style={{ color: C.muted }}>{[size, color].filter(Boolean).join(" / ")}</p>}
                  <div className="flex items-center gap-1 mt-1">
                    <button type="button" aria-label={t("Mwens")} onClick={() => setLine(key, qty - 1)} className="w-7 h-7 rounded-md border flex items-center justify-center" style={{ borderColor: C.line }}><Minus size={12} /></button>
                    <span className="w-7 text-center text-sm font-bold tabular-nums">{qty}</span>
                    <button type="button" aria-label={t("Plis")} onClick={() => setLine(key, qty + 1)} disabled={qty >= p.stock} className="w-7 h-7 rounded-md border flex items-center justify-center disabled:opacity-30" style={{ borderColor: C.line }}><Plus size={12} /></button>
                    <button type="button" aria-label={t("Retire")} onClick={() => setLine(key, 0)} className="ml-1 p-1" style={{ color: C.muted }}><Trash2 size={15} /></button>
                  </div>
                </div>
                <span className="text-sm font-bold tabular-nums">{money(p.price * qty)}</span>
              </div>
            ))}
          </div>

          {/* Koupon */}
          <div className="mb-4">
            {appliedCode && view.couponCode ? (
              <div className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold" style={{ background: "#ECFDF3", color: C.ok }}>
                <span className="inline-flex items-center gap-2"><Tag size={15} /> {t("{code} aplike", { code: view.couponCode })}</span>
                <button type="button" onClick={() => { setAppliedCode(""); setCodeInput(""); }} className="underline text-xs">{t("Retire")}</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input className={`${fieldClass} !py-2.5`} style={fieldStyle} placeholder={t("Kòd promosyon")} value={codeInput} onChange={(e) => setCodeInput(e.target.value.toUpperCase())} maxLength={20} />
                <button type="button" onClick={() => setAppliedCode(codeInput.trim())} disabled={!codeInput.trim()} className="px-4 rounded-xl border-2 font-bold text-sm disabled:opacity-40" style={{ borderColor: C.ink }}>{t("Aplike")}</button>
              </div>
            )}
            {view.couponError && appliedCode && <p className="text-xs mt-1.5 font-medium" style={{ color: C.red }}>{t(view.couponError)}</p>}
          </div>

          <dl className="space-y-1.5 text-sm">
            <Row label={t("Sou-total")} value={money(view.subtotal)} />
            {view.discount > 0 && <Row label={t("Rabè koupon")} value={`- ${money(view.discount)}`} color={C.ok} />}
            <Row label={method === "pickup" ? t("Ranmase") : t("Livrezon")} value={view.shipping > 0 ? money(view.shipping) : "Gratis"} />
            {method === "delivery" && eta && <Row label={t("Tan livrezon")} value={eta} />}
            <div className="flex justify-between text-lg font-bold pt-3 mt-2 border-t" style={{ borderColor: C.line }}>
              <dt>{t("Total")}</dt>
              <dd className="tabular-nums">{quoting && !quote ? "…" : money(view.total)}</dd>
            </div>
          </dl>

          <button type="submit" disabled={busy} className="mt-5 w-full min-h-[54px] rounded-xl text-base font-bold text-white disabled:opacity-60 flex items-center justify-center gap-2" style={{ background: C.red }}>
            {busy && <Loader2 size={20} className="animate-spin" />} {t("Konfime kòmand lan")}
          </button>
          {error && <p className="mt-3 text-center text-sm font-medium" style={{ color: C.red }}>{error}</p>}
          <p className="mt-3 text-center text-xs" style={{ color: C.muted }}>{t("Ou pa peye anyen kounye a — boutik la ap konfime kòmand lan avè w.")}</p>
        </aside>
      </form>
    </main>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border p-5 bg-white" style={{ borderColor: C.line }}>
      <h2 className="font-bold mb-3">{title}</h2>
      {children}
    </section>
  );
}

function Choice({ active, onClick, icon, title, sub }: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string; sub: string }) {
  return (
    <button type="button" onClick={onClick} className="rounded-xl border-2 p-3.5 text-left flex items-center gap-3" style={{ borderColor: active ? C.ink : C.line, background: active ? C.soft : "#fff" }}>
      {icon}
      <span><b className="block text-sm">{title}</b><span className="text-xs" style={{ color: C.muted }}>{sub}</span></span>
    </button>
  );
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex justify-between" style={color ? { color } : undefined}>
      <dt>{label}</dt>
      <dd className="tabular-nums font-medium">{value}</dd>
    </div>
  );
}
