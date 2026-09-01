"use client";

import { useEffect, useState, useCallback } from "react";
import { Undo2, Loader2, PackageCheck } from "lucide-react";
import { BusinessSwitcher } from "@/components/dashboard/business-switcher";
import type { Business, Product } from "@/types";
import type { ReturnRecord } from "@/app/api/returns/route";

const REASONS = ["Pwodwi domaje", "Move pwodwi", "Kliyan chanje lide", "Erè kòmand", "Lòt"];

function fmt(n: number) {
  return `${n.toLocaleString("fr-FR")} G`;
}

export default function ReturnsPage() {
  const [businesses, setBusinesses] = useState<Business[] | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState(REASONS[0]);
  const [refundAmount, setRefundAmount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/businesses")
      .then((res) => res.json())
      .then((data) => {
        setBusinesses(data.businesses ?? []);
        if (data.businesses?.length) setBusinessId(data.businesses[0].id);
      })
      .catch(() => setBusinesses([]));
  }, []);

  const loadData = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    const [productsRes, returnsRes] = await Promise.all([
      fetch(`/api/products?businessId=${businessId}`).then((r) => r.json()),
      fetch(`/api/returns?businessId=${businessId}`).then((r) => r.json()),
    ]);
    const prods = (productsRes.products ?? []).filter(Boolean);
    setProducts(prods);
    setReturns((returnsRes.returns ?? []).filter(Boolean));
    if (prods.length) setProductId((prev) => prev || prods[0].id);
    setLoading(false);
  }, [businessId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!businessId || !productId) return;
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, productId, qty, reason, refundAmount }),
      });
      if (!res.ok) {
        const data = await res.json();
        setStatus(data.error || "Pa ka anrejistre retou a.");
        setSaving(false);
        return;
      }
      setStatus("Retou anrejistre — stok mete ajou.");
      setQty(1);
      setRefundAmount(0);
      await loadData();
    } catch {
      setStatus("Erè rezo — eseye ankò.");
    }
    setSaving(false);
  }

  if (businesses === null) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 flex flex-col items-center text-ink/40 dark:text-paper/40">
        <Loader2 size={24} className="animate-spin mb-2" />
        <p className="text-sm">Ap chaje...</p>
      </main>
    );
  }

  if (businesses.length === 0) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 text-center">
        <Undo2 size={28} className="mx-auto mb-3 text-ink/30" />
        <p className="text-sm text-ink/60 dark:text-paper/60">
          Kreye yon antrepriz anvan pou ka anrejistre retou.
        </p>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 lg:px-8 py-8 pb-24">
      <h1 className="font-display text-xl lg:text-2xl mb-1">Retou Machandiz</h1>
      <p className="text-sm text-ink/60 dark:text-paper/60 mb-4">
        Antre yon pwodwi kliyan retounen — stok la mete ajou otomatikman.
      </p>

      <BusinessSwitcher
        businesses={businesses.map((b) => ({ id: b.id, name: b.name, icon: b.icon }))}
        activeId={businessId ?? ""}
        onSelect={setBusinessId}
        showOverviewTab={false}
      />

      <form
        onSubmit={handleSubmit}
        className="rounded-card border border-ink/10 dark:border-dark-border bg-white dark:bg-dark-surface p-5 my-5 space-y-4"
      >
        <label className="block">
          <span className="block text-xs font-medium text-ink/70 dark:text-paper/70 mb-1">
            Pwodwi
          </span>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="w-full border border-ink/15 dark:border-dark-border bg-white dark:bg-dark-surface rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30"
          >
            {products.length === 0 && <option value="">Pa gen pwodwi</option>}
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (stok: {p.stock})
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="block text-xs font-medium text-ink/70 dark:text-paper/70 mb-1">
              Kantite
            </span>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              className="w-full border border-ink/15 dark:border-dark-border bg-white dark:bg-dark-surface rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30"
            />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-ink/70 dark:text-paper/70 mb-1">
              Rembousman (G)
            </span>
            <input
              type="number"
              min={0}
              value={refundAmount}
              onChange={(e) => setRefundAmount(Number(e.target.value))}
              className="w-full border border-ink/15 dark:border-dark-border bg-white dark:bg-dark-surface rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30"
            />
          </label>
        </div>

        <label className="block">
          <span className="block text-xs font-medium text-ink/70 dark:text-paper/70 mb-1">
            Rezon
          </span>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full border border-ink/15 dark:border-dark-border bg-white dark:bg-dark-surface rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30"
          >
            {REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          disabled={saving || !productId}
          className="w-full bg-brick text-paper rounded-full py-2.5 text-sm font-medium disabled:opacity-50"
        >
          {saving ? "Ap anrejistre..." : "Konfime retou a"}
        </button>

        {status && <p className="text-sm text-center text-ink/60 dark:text-paper/60">{status}</p>}
      </form>

      <h2 className="font-display text-base mb-2">Dènye retou</h2>
      {loading ? (
        <div className="flex justify-center py-10 text-ink/40 dark:text-paper/40">
          <Loader2 size={20} className="animate-spin" />
        </div>
      ) : returns.length === 0 ? (
        <div className="text-center py-10 text-ink/40 dark:text-paper/40">
          <PackageCheck size={24} className="mx-auto mb-2" />
          <p className="text-sm">Poko gen retou.</p>
        </div>
      ) : (
        <div className="rounded-card border border-ink/10 dark:border-dark-border bg-white dark:bg-dark-surface overflow-hidden">
          {returns.map((r, i) => (
            <div
              key={r.id}
              className={`flex items-center justify-between px-4 py-3 text-sm ${
                i > 0 ? "border-t border-ink/8 dark:border-dark-border/60" : ""
              }`}
            >
              <span>
                {r.qty} × {r.productName}
                <span className="block text-xs text-ink/40 dark:text-paper/40">{r.reason}</span>
              </span>
              <span className="text-right">
                <span className="stat-figure block font-medium">{fmt(r.refundAmount)}</span>
                <span className="block text-xs text-ink/40 dark:text-paper/40">
                  {new Date(r.createdAt).toLocaleDateString("fr-FR")}
                </span>
              </span>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
