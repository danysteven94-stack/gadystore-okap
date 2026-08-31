"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Search, Plus, Package, Loader2 } from "lucide-react";
import { BusinessSwitcher } from "@/components/dashboard/business-switcher";
import { StockBar } from "@/components/products/stock-bar";
import { ProductForm, type ProductFormValues } from "@/components/products/product-form";
import type { Business, Product } from "@/types";

function fmt(n: number) {
  return `${n.toLocaleString("fr-FR")} G`;
}

export default function ProductsPage() {
  const [businesses, setBusinesses] = useState<Business[] | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [formTarget, setFormTarget] = useState<"new" | Product | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/businesses")
      .then((res) => res.json())
      .then((data) => {
        setBusinesses(data.businesses ?? []);
        if (data.businesses?.length) setBusinessId(data.businesses[0].id);
      })
      .catch(() => setBusinesses([]));
  }, []);

  const loadProducts = useCallback(async () => {
    if (!businessId) return;
    setLoadingProducts(true);
    try {
      const res = await fetch(`/api/products?businessId=${businessId}`);
      const data = await res.json();
      setProducts((data.products ?? []).filter(Boolean));
    } catch {
      setError("Pa ka chaje pwodwi yo.");
    }
    setLoadingProducts(false);
  }, [businessId]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const categories = useMemo(() => [...new Set(products.map((p) => p.category))], [products]);

  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) &&
          (!categoryFilter || p.category === categoryFilter)
      ),
    [products, query, categoryFilter]
  );

  const lowCount = products.filter((p) => p.stock <= p.minStock).length;
  const stockValue = products.reduce((sum, p) => sum + p.stock * p.buyPrice, 0);

  async function handleSave(values: ProductFormValues) {
    if (!businessId) return;
    setError(null);
    try {
      if (values.id) {
        const res = await fetch(`/api/products/${values.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        if (!res.ok) throw new Error();
      } else {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...values, businessId }),
        });
        if (!res.ok) throw new Error();
      }
      setFormTarget(null);
      await loadProducts();
    } catch {
      setError("Pa ka anrejistre pwodwi a. Eseye ankò.");
    }
  }

  async function handleDelete() {
    if (formTarget && formTarget !== "new") {
      try {
        await fetch(`/api/products/${formTarget.id}`, { method: "DELETE" });
      } catch {
        setError("Pa ka efase pwodwi a.");
      }
    }
    setFormTarget(null);
    await loadProducts();
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
        <Package size={28} className="mx-auto mb-3 text-ink/30" />
        <p className="text-sm text-ink/60 dark:text-paper/60">
          Ale nan Tablo Debò a pou kreye premye antrepriz ou anvan w ajoute pwodwi.
        </p>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-6 pb-24">
      <h1 className="font-display text-xl mb-4">Pwodwi & Stok</h1>

      <BusinessSwitcher
        businesses={businesses.map((b) => ({ id: b.id, name: b.name, icon: b.icon }))}
        activeId={businessId ?? ""}
        onSelect={(id) => {
          setBusinessId(id);
          setCategoryFilter(null);
        }}
        showOverviewTab={false}
      />

      <div className="grid grid-cols-3 gap-2 my-4">
        <div className="rounded-card border border-ink/10 dark:border-dark-border bg-white dark:bg-dark-surface p-3">
          <p className="text-xs text-ink/50 dark:text-paper/50 mb-1">Pwodwi</p>
          <p className="stat-figure text-lg font-medium">{products.length}</p>
        </div>
        <div className="rounded-card border border-ink/10 dark:border-dark-border bg-white dark:bg-dark-surface p-3">
          <p className="text-xs text-ink/50 dark:text-paper/50 mb-1">Stok fèb</p>
          <p className="stat-figure text-lg font-medium text-brick">{lowCount}</p>
        </div>
        <div className="rounded-card border border-ink/10 dark:border-dark-border bg-white dark:bg-dark-surface p-3">
          <p className="text-xs text-ink/50 dark:text-paper/50 mb-1">Valè stok</p>
          <p className="stat-figure text-lg font-medium">{fmt(stockValue)}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Chèche yon pwodwi..."
            className="w-full border border-ink/15 dark:border-dark-border bg-white dark:bg-dark-surface rounded-full pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30"
          />
        </div>
        <button
          onClick={() => setFormTarget("new")}
          className="w-10 h-10 rounded-full bg-ink text-paper flex items-center justify-center shrink-0"
          aria-label="Ajoute yon pwodwi"
        >
          <Plus size={18} />
        </button>
      </div>

      {categories.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 mb-4 -mx-1 px-1">
          <button
            onClick={() => setCategoryFilter(null)}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium border ${
              !categoryFilter ? "bg-ink text-paper border-ink" : "border-ink/15 dark:border-dark-border text-ink/70 dark:text-paper/70"
            }`}
          >
            Tout
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium border ${
                categoryFilter === cat
                  ? "bg-ink text-paper border-ink"
                  : "border-ink/15 dark:border-dark-border text-ink/70 dark:text-paper/70"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-brick mb-3">{error}</p>}

      {loadingProducts ? (
        <div className="flex justify-center py-10 text-ink/40 dark:text-paper/40">
          <Loader2 size={20} className="animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-ink/40 dark:text-paper/40">
          <Package size={28} className="mx-auto mb-2" />
          <p className="text-sm">
            {products.length === 0 ? "Ou poko gen pwodwi. Ajoute premye a." : "Pa gen pwodwi ki koresponn."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => setFormTarget(p)}
              className="w-full text-left rounded-card border border-ink/10 dark:border-dark-border bg-white dark:bg-dark-surface p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-ink/50 dark:text-paper/50">{p.category}</p>
                </div>
                <div className="text-right">
                  <p className="stat-figure text-sm font-medium">{fmt(p.sellPrice)}</p>
                  <p className="text-xs text-ink/40 dark:text-paper/40">achte {fmt(p.buyPrice)}</p>
                </div>
              </div>
              <StockBar stock={p.stock} minStock={p.minStock} />
            </button>
          ))}
        </div>
      )}

      {formTarget && (
        <ProductForm
          initial={formTarget === "new" ? undefined : formTarget}
          onSave={handleSave}
          onDelete={formTarget !== "new" ? handleDelete : undefined}
          onClose={() => setFormTarget(null)}
        />
      )}
    </main>
  );
}
