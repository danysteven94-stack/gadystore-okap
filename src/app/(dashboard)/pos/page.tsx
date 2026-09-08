"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Search, ScanLine, Loader2, ShoppingCart } from "lucide-react";
import { BusinessSwitcher } from "@/components/dashboard/business-switcher";
import { Cart, type CartItem } from "@/components/pos/cart";
import { BarcodeScanner } from "@/components/pos/barcode-scanner";
import { useLanguage } from "@/lib/i18n/language-provider";
import type { Business, Product } from "@/types";

function fmt(n: number) {
  return `${n.toLocaleString("fr-FR")} G`;
}

export default function POSPage() {
  const { t } = useLanguage();
  const [businesses, setBusinesses] = useState<Business[] | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [taxRate, setTaxRate] = useState(0);

  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "card" | "mobile_money" | "mixed"
  >("cash");
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/businesses")
      .then((res) => res.json())
      .then((data) => {
        setBusinesses(data.businesses ?? []);
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
      setProducts([]);
    }
    setLoadingProducts(false);
  }, [businessId]);

  useEffect(() => {
    loadProducts();
    setCart([]);
  }, [loadProducts]);

  const results = useMemo(
    () => products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())),
    [products, query]
  );

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        if (existing.qty >= product.stock) return prev;
        return prev.map((i) =>
          i.productId === product.id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          unitPrice: product.sellPrice,
          qty: 1,
          stock: product.stock,
        },
      ];
    });
  }

  function handleScan(barcode: string) {
    const product = products.find((p) => p.barcode === barcode);
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
        i.productId === productId && i.qty < i.stock ? { ...i, qty: i.qty + 1 } : i
      )
    );
  }

  function decrease(productId: string) {
    setCart((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, qty: i.qty - 1 } : i)).filter((i) => i.qty > 0)
    );
  }

  function remove(productId: string) {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  }

  const subtotal = cart.reduce((sum, i) => sum + i.qty * i.unitPrice, 0);
  const tax = (subtotal * taxRate) / 100;
  const total = subtotal + tax;

  async function checkout() {
    if (cart.length === 0 || !businessId) return;
    setStatus(t("pos_processing"));

    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          items: cart.map((i) => ({
            productId: i.productId,
            name: i.name,
            qty: i.qty,
            unitPrice: i.unitPrice,
          })),
          discount: 0,
          taxRate,
          paymentMethod,
        }),
      });

      if (!res.ok) {
        let data: { error?: string; detail?: string } = {};
        try {
          data = await res.json();
        } catch {
          setStatus(`Erè sèvè (kòd ${res.status}).`);
          return;
        }
        setStatus(data.detail ? `${data.error} — ${data.detail}` : data.error ?? "Vant lan echwe.");
        return;
      }

      setCart([]);
      setStatus(t("pos_success"));
      await loadProducts();
    } catch {
      setStatus("Erè rezo — eseye ankò.");
    }
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
        <ShoppingCart size={28} className="mx-auto mb-3 text-ink/30" />
        <p className="text-sm text-ink/60 dark:text-paper/60">
          {t("products_need_business")}
        </p>
      </main>
    );
  }

  if (!businessId) {
    return (
      <main className="max-w-3xl mx-auto px-4 lg:px-8 py-8">
        <BusinessSwitcher
          businesses={businesses.map((b) => ({ id: b.id, name: b.name, icon: b.icon }))}
          activeId=""
          onSelect={setBusinessId}
          showOverviewTab={false}
        />
        <p className="text-sm text-center text-ink/40 dark:text-paper/40 py-10">
          {t("choose_business_prompt")}
        </p>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-6 pb-24">
      <h1 className="font-display text-xl mb-4">{t("pos_title")}</h1>

      <BusinessSwitcher
        businesses={businesses.map((b) => ({ id: b.id, name: b.name, icon: b.icon }))}
        activeId={businessId ?? ""}
        onSelect={(id) => {
          setBusinessId(id);
          setTaxRate(businesses.find((b) => b.id === id)?.taxRate ?? 0);
        }}
        showOverviewTab={false}
      />

      <div className="flex gap-2 my-4">
        <div className="flex-1 relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40 dark:text-paper/40"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("pos_search")}
            className="w-full border border-ink/15 dark:border-dark-border rounded-full pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30"
          />
        </div>
        <button
          onClick={() => setShowScanner(true)}
          aria-label={t("pos_scan")}
          className="w-10 h-10 rounded-full bg-ink text-paper flex items-center justify-center shrink-0"
        >
          <ScanLine size={18} />
        </button>
      </div>

      {loadingProducts ? (
        <div className="flex justify-center py-10 text-ink/40 dark:text-paper/40">
          <Loader2 size={20} className="animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 mb-6">
          {results.map((p) => (
            <button
              key={p.id}
              onClick={() => addToCart(p)}
              disabled={p.stock === 0}
              className="text-left rounded-card border border-ink/10 dark:border-dark-border bg-white dark:bg-dark-surface p-3 disabled:opacity-40"
            >
              <p className="text-sm font-medium">{p.name}</p>
              <p className="text-xs text-ink/50 dark:text-paper/50">{fmt(p.sellPrice)}</p>
            </button>
          ))}
        </div>
      )}

      <h2 className="font-display text-base mb-2">{t("pos_cart")}</h2>
      <Cart items={cart} onIncrease={increase} onDecrease={decrease} onRemove={remove} />

      <div className="mt-4 space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-ink/60 dark:text-paper/60">{t("pos_subtotal")}</span>
          <span className="stat-figure">{fmt(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink/60 dark:text-paper/60">{t("pos_tax")} ({taxRate}%)</span>
          <span className="stat-figure">{fmt(tax)}</span>
        </div>
        <div className="flex justify-between text-base font-medium pt-1 border-t border-ink/10 dark:border-dark-border">
          <span>{t("pos_total")}</span>
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
            {
              {
                cash: t("pos_cash"),
                card: t("pos_card"),
                mobile_money: t("pos_mobile_money"),
                mixed: t("pos_mixed"),
              }[method]
            }
          </button>
        ))}
      </div>

      <button
        onClick={checkout}
        disabled={cart.length === 0}
        className="w-full bg-forest text-paper rounded-full py-3 text-sm font-medium mt-4 disabled:opacity-40"
      >
        {t("pos_confirm")} — {fmt(total)}
      </button>

      {status && <p className="text-sm text-center text-ink/60 dark:text-paper/60 mt-3">{status}</p>}

      {showScanner && (
        <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
      )}
    </main>
  );
}
