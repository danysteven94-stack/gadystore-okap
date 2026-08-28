"use client";

import { useMemo, useState } from "react";
import { Search, Plus, Package } from "lucide-react";
import { BusinessSwitcher } from "@/components/dashboard/business-switcher";
import { StockBar } from "@/components/products/stock-bar";
import { ProductForm, type ProductFormValues } from "@/components/products/product-form";

const BUSINESSES = [
  { id: "wholesale", name: "Gwo & Detay", icon: "warehouse" },
  { id: "import", name: "Enpòtasyon Pwodwi", icon: "ship" },
  { id: "food", name: "Manje, Patisri & Gato", icon: "cake" },
  { id: "electronics", name: "Pwodwi Elektwonik", icon: "smartphone" },
  { id: "streaming", name: "Pwodwi Streaming", icon: "streaming" },
];

interface Product extends ProductFormValues {
  id: string;
  businessId: string;
}

// Données de démonstration — à remplacer par un fetch de /api/products?businessId=
const INITIAL_PRODUCTS: Product[] = [
  { id: "p1", businessId: "wholesale", name: "Sak diri 25lb", category: "Grenn", buyPrice: 1400, sellPrice: 1700, stock: 6, minStock: 10, barcode: "1001" },
  { id: "p2", businessId: "wholesale", name: "Luil kwit galon", buyPrice: 900, sellPrice: 1150, category: "Luil", stock: 22, minStock: 8, barcode: "1002" },
  { id: "p3", businessId: "wholesale", name: "Konsèv tomat", category: "Konsèv", buyPrice: 65, sellPrice: 90, stock: 9, minStock: 15, barcode: "1003" },
  { id: "p4", businessId: "import", name: "Pyès rechany oto", category: "Otomobil", buyPrice: 500, sellPrice: 750, stock: 3, minStock: 6, barcode: "2001" },
  { id: "p5", businessId: "import", name: "Twal ang gwo (bal)", category: "Twal", buyPrice: 2800, sellPrice: 3700, stock: 12, minStock: 4, barcode: "2002" },
  { id: "p6", businessId: "food", name: "Gato chokola (pòsyon)", category: "Patisri", buyPrice: 90, sellPrice: 150, stock: 24, minStock: 10, barcode: "3001" },
  { id: "p7", businessId: "food", name: "Farin patisri (sak)", category: "Engredyan", buyPrice: 320, sellPrice: 0, stock: 4, minStock: 6, barcode: "3002" },
  { id: "p8", businessId: "food", name: "Bè (liv)", category: "Engredyan", buyPrice: 85, sellPrice: 0, stock: 5, minStock: 8, barcode: "3003" },
  { id: "p9", businessId: "electronics", name: "Ekoutè bluetooth", category: "Akseswa", buyPrice: 450, sellPrice: 700, stock: 2, minStock: 6, barcode: "4001" },
  { id: "p10", businessId: "electronics", name: "Kab USB-C", category: "Akseswa", buyPrice: 60, sellPrice: 100, stock: 7, minStock: 15, barcode: "4002" },
  { id: "p11", businessId: "electronics", name: "Pawòl bwat (speaker)", category: "Odyo", buyPrice: 900, sellPrice: 1300, stock: 11, minStock: 5, barcode: "4003" },
  { id: "p12", businessId: "streaming", name: "Abònman 1-mwa", category: "Abònman", buyPrice: 0, sellPrice: 100, stock: 999, minStock: 0, barcode: "5001" },
  { id: "p13", businessId: "streaming", name: "Abònman 3-mwa", category: "Abònman", buyPrice: 0, sellPrice: 270, stock: 999, minStock: 0, barcode: "5002" },
];

function fmt(n: number) {
  return `${n.toLocaleString("fr-FR")} G`;
}

export default function ProductsPage() {
  const [businessId, setBusinessId] = useState("wholesale");
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [formTarget, setFormTarget] = useState<"new" | Product | null>(null);

  const businessProducts = useMemo(
    () => products.filter((p) => p.businessId === businessId),
    [products, businessId]
  );

  const categories = useMemo(
    () => [...new Set(businessProducts.map((p) => p.category))],
    [businessProducts]
  );

  const filtered = useMemo(
    () =>
      businessProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) &&
          (!categoryFilter || p.category === categoryFilter)
      ),
    [businessProducts, query, categoryFilter]
  );

  const lowCount = businessProducts.filter((p) => p.stock <= p.minStock).length;
  const stockValue = businessProducts.reduce((sum, p) => sum + p.stock * p.buyPrice, 0);

  function handleSave(values: ProductFormValues) {
    if (values.id) {
      setProducts((prev) =>
        prev.map((p) => (p.id === values.id ? { ...p, ...values } : p))
      );
    } else {
      setProducts((prev) => [
        ...prev,
        { ...values, id: crypto.randomUUID(), businessId },
      ]);
    }
    setFormTarget(null);
  }

  function handleDelete() {
    if (formTarget && formTarget !== "new") {
      setProducts((prev) => prev.filter((p) => p.id !== formTarget.id));
    }
    setFormTarget(null);
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-6 pb-24">
      <h1 className="font-display text-xl mb-4">Pwodwi & Stok</h1>

      <BusinessSwitcher
        businesses={BUSINESSES}
        activeId={businessId}
        onSelect={(id) => {
          setBusinessId(id);
          setCategoryFilter(null);
        }}
        showOverviewTab={false}
      />

      <div className="grid grid-cols-3 gap-2 my-4">
        <div className="rounded-card border border-ink/10 dark:border-dark-border bg-white dark:bg-dark-surface p-3">
          <p className="text-xs text-ink/50 dark:text-paper/50 mb-1">Pwodwi</p>
          <p className="stat-figure text-lg font-medium">{businessProducts.length}</p>
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
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40 dark:text-paper/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Chèche yon pwodwi..."
            className="w-full border border-ink/15 dark:border-dark-border rounded-full pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30"
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

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-ink/40 dark:text-paper/40">
          <Package size={28} className="mx-auto mb-2" />
          <p className="text-sm">Pa gen pwodwi ki koresponn.</p>
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
