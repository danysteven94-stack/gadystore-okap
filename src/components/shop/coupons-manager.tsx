"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Tag, Trash2 } from "lucide-react";

interface Coupon {
  code: string;
  type: "percent" | "fixed";
  value: number;
  minOrder: number;
  maxUses: number;
  uses: number;
  expiresAt: string;
  active: boolean;
}

const inputClass =
  "w-full border border-ink/15 dark:border-dark-border bg-white dark:bg-dark-surface rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brick/30";

/** Dashboard: kreye ak jere kòd promosyon pou boutik la. */
export function CouponsManager({ businessId, currency }: { businessId: string; currency: string }) {
  const [coupons, setCoupons] = useState<Coupon[] | null>(null);
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/shop/coupons?businessId=${businessId}`);
      const data = await res.json();
      setCoupons(data.coupons ?? []);
    } catch {
      setCoupons([]);
    }
  }, [businessId]);

  useEffect(() => {
    setCoupons(null);
    load();
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/shop/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          code,
          type,
          value: Number(value),
          minOrder: minOrder ? Number(minOrder) : 0,
          maxUses: maxUses ? Number(maxUses) : 0,
          expiresAt: expiresAt || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error || "Pa ka kreye koupon an.");
      else {
        setCode("");
        setValue("");
        setMinOrder("");
        setMaxUses("");
        setExpiresAt("");
        await load();
      }
    } catch {
      setError("Erè rezo — eseye ankò.");
    }
    setBusy(false);
  }

  async function toggle(c: Coupon) {
    await fetch("/api/shop/coupons", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId, code: c.code, active: !c.active }),
    }).catch(() => {});
    await load();
  }

  async function remove(c: Coupon) {
    if (!window.confirm(`Efase koupon ${c.code}?`)) return;
    await fetch(`/api/shop/coupons?businessId=${businessId}&code=${encodeURIComponent(c.code)}`, { method: "DELETE" }).catch(() => {});
    await load();
  }

  return (
    <div className="rounded-card border border-ink/10 dark:border-dark-border bg-white dark:bg-dark-surface p-5">
      <h2 className="font-display font-semibold text-lg flex items-center gap-2 mb-1"><Tag size={18} /> Kòd promosyon</h2>
      <p className="text-xs text-ink/50 dark:text-white/50 mb-4">Kliyan an antre kòd la nan paj kòmand lan. Rabè a kalkile sou sèvè a.</p>

      <form onSubmit={add} className="space-y-3 mb-5">
        <div className="grid grid-cols-2 gap-3">
          <input className={inputClass} placeholder="KÒD (ekz: BYENVENI10)" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={20} required />
          <select className={inputClass} value={type} onChange={(e) => setType(e.target.value as "percent" | "fixed")}>
            <option value="percent">Pousantaj (%)</option>
            <option value="fixed">Montan fiks ({currency})</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input className={inputClass} type="number" min={1} max={type === "percent" ? 100 : undefined} placeholder={type === "percent" ? "Ekz: 10 (%)" : "Ekz: 250"} value={value} onChange={(e) => setValue(e.target.value)} required />
          <input className={inputClass} type="number" min={0} placeholder="Kòmand minimòm (opsyonèl)" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input className={inputClass} type="number" min={0} placeholder="Max itilizasyon (opsyonèl)" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} />
          <input className={inputClass} type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} aria-label="Dat ekspirasyon" />
        </div>
        <button disabled={busy} className="w-full inline-flex items-center justify-center gap-2 bg-brick hover:bg-brick-dark text-white rounded-md py-2.5 text-sm font-medium disabled:opacity-50">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Ajoute koupon
        </button>
        {error && <p className="text-sm text-brick text-center">{error}</p>}
      </form>

      {coupons === null ? (
        <div className="flex justify-center py-4 text-ink/40"><Loader2 size={18} className="animate-spin" /></div>
      ) : coupons.length === 0 ? (
        <p className="text-sm text-center text-ink/40 dark:text-white/40 py-3">Poko gen koupon.</p>
      ) : (
        <ul className="space-y-2">
          {coupons.map((c) => (
            <li key={c.code} className="flex items-center gap-3 rounded-lg border border-ink/10 dark:border-dark-border p-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold stat-figure">{c.code}</p>
                <p className="text-xs text-ink/55 dark:text-white/55">
                  {c.type === "percent" ? `${c.value}%` : `${c.value.toLocaleString("fr-FR")} ${currency}`}
                  {c.minOrder > 0 ? ` · min ${c.minOrder.toLocaleString("fr-FR")}` : ""}
                  {` · ${c.uses}${c.maxUses > 0 ? `/${c.maxUses}` : ""} itilizasyon`}
                  {c.expiresAt ? ` · rive ${c.expiresAt}` : ""}
                </p>
              </div>
              <button
                onClick={() => toggle(c)}
                role="switch"
                aria-checked={c.active}
                aria-label={`Aktive ${c.code}`}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 ${c.active ? "bg-brick" : "bg-ink/20"}`}
              >
                <span className={`block w-5 h-5 rounded-full bg-white transition-transform ${c.active ? "translate-x-5" : ""}`} />
              </button>
              <button onClick={() => remove(c)} aria-label="Efase" className="p-1.5 text-brick"><Trash2 size={16} /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
