"use client";

import { useMemo, useState } from "react";
import { Search, ScanLine } from "lucide-react";
import { Cart, type CartItem } from "@/components/pos/cart";
import { BarcodeScanner } from "@/components/pos/barcode-scanner";

// Catalogue de démonstration — à remplacer par un fetch de /api/products?businessId=
const CATALOG = [
  { productId: "p1", name: "Griyo konplè", unitPrice: 850, stock: 12, barcode: "0001" },
  { productId: "p2", name: "Bwason", unitPrice: 350, stock: 40, barcode: "0002" },
  { productId: "p3", name: "Pat", unitPrice: 600, stock: 8, barcode: "0003" },
  { productId: "p4", name: "Diri kole", unitPrice: 500, stock: 20, barcode: "0004" },
];

const TAX_RATE = 10; // pousantaj — configirab pa antrepriz

function fmt(n: number) {
  return `${n.toLocaleString("fr-FR")} G`;
}

export default function POSPage() {
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "card" | "mobile_money" | "mixed"
  >("cash");
  const [status, setStatus] = useState<string | null>(null);

  const results = useMemo(
    () =>
      CATALOG.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase())
      ),
    [query]
  );

  function addToCart(product: (typeof CATALOG)[number]) {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.productId);
      if (existing) {
        if (existing.qty >= product.stock) return prev;
        return prev.map((i) =>
          i.productId === product.productId ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [
        ...prev,
        {
          productId: product.productId,
          name: product.name,
          unitPrice: product.unitPrice,
          qty: 1,
          stock: product.stock,
        },
      ];
    });
  }

  function handleScan(barcode: string) {
    const product = CATALOG.find((p) => p.barcode === barcode);
    setShowScanner(false);
    if (product) {
      addToCart(product);
      setStatus(`${product.name} ajoute nan panye a.`);
    } else {
      setStatus("Pa jwenn okenn pwodwi ak kòd-baf sa a.");
    }
  }

  function increase(productId: string) {
    setCart((prev) =>
      prev.map((i) =>
        i.productId === productId && i.qty < i.stock
          ? { ...i, qty: i.qty + 1 }
          : i
      )
    );
  }

  function decrease(productId: string) {
    setCart((prev) =>
      prev
        .map((i) =>
          i.productId === productId ? { ...i, qty: i.qty - 1 } : i
        )
        .filter((i) => i.qty > 0)
    );
  }

  function remove(productId: string) {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  }

  const subtotal = cart.reduce((sum, i) => sum + i.qty * i.unitPrice, 0);
  const tax = (subtotal * TAX_RATE) / 100;
  const total = subtotal + tax;

  async function checkout() {
    if (cart.length === 0) return;
    setStatus("Ap anrejistre vant lan...");

    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: "demo-business-id",
          items: cart.map((i) => ({
            productId: i.productId,
            name: i.name,
            qty: i.qty,
            unitPrice: i.unitPrice,
          })),
          discount: 0,
          taxRate: TAX_RATE,
          paymentMethod,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setStatus(data.error ?? "Vant lan echwe.");
        return;
      }

      setCart([]);
      setStatus("Vant anrejistre ak siksè! Fakti a disponib.");
    } catch {
      setStatus("Erè rezo — eseye ankò.");
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="font-display text-xl mb-4">Kès (POS)</h1>

      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40 dark:text-paper/40"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Chèche yon pwodwi..."
            className="w-full border border-ink/15 dark:border-dark-border rounded-full pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30"
          />
        </div>
        <button
          onClick={() => setShowScanner(true)}
          aria-label="Eskane kòd-baf"
          className="w-10 h-10 rounded-full bg-ink text-paper flex items-center justify-center shrink-0"
        >
          <ScanLine size={18} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-6">
        {results.map((p) => (
          <button
            key={p.productId}
            onClick={() => addToCart(p)}
            disabled={p.stock === 0}
            className="text-left rounded-card border border-ink/10 dark:border-dark-border bg-white dark:bg-dark-surface p-3 disabled:opacity-40"
          >
            <p className="text-sm font-medium">{p.name}</p>
            <p className="text-xs text-ink/50 dark:text-paper/50">{fmt(p.unitPrice)}</p>
          </button>
        ))}
      </div>

      <h2 className="font-display text-base mb-2">Panye</h2>
      <Cart items={cart} onIncrease={increase} onDecrease={decrease} onRemove={remove} />

      <div className="mt-4 space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-ink/60 dark:text-paper/60">Sou-total</span>
          <span className="stat-figure">{fmt(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink/60 dark:text-paper/60">Taks ({TAX_RATE}%)</span>
          <span className="stat-figure">{fmt(tax)}</span>
        </div>
        <div className="flex justify-between text-base font-medium pt-1 border-t border-ink/10 dark:border-dark-border">
          <span>Total</span>
          <span className="stat-figure">{fmt(total)}</span>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        {(["cash", "card", "mobile_money", "mixed"] as const).map((method) => (
          <button
            key={method}
            onClick={() => setPaymentMethod(method)}
            className={`flex-1 text-xs py-2 rounded-full border ${
              paymentMethod === method
                ? "bg-ink text-paper border-ink"
                : "border-ink/15 dark:border-dark-border text-ink/70 dark:text-paper/70"
            }`}
          >
            {{ cash: "Cash", card: "Kat", mobile_money: "Mobile Money", mixed: "Miks" }[method]}
          </button>
        ))}
      </div>

      <button
        onClick={checkout}
        disabled={cart.length === 0}
        className="w-full bg-forest text-paper rounded-full py-3 text-sm font-medium mt-4 disabled:opacity-40"
      >
        Konfime vant — {fmt(total)}
      </button>

      {status && <p className="text-sm text-center text-ink/60 dark:text-paper/60 mt-3">{status}</p>}

      {showScanner && (
        <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
      )}
    </main>
  );
}
