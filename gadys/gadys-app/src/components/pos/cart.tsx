"use client";

import { Minus, Plus, Trash2 } from "lucide-react";

export interface CartItem {
  productId: string;
  name: string;
  unitPrice: number;
  qty: number;
  stock: number;
}

interface Props {
  items: CartItem[];
  onIncrease: (productId: string) => void;
  onDecrease: (productId: string) => void;
  onRemove: (productId: string) => void;
}

function fmt(n: number) {
  return `${n.toLocaleString("fr-FR")} G`;
}

export function Cart({ items, onIncrease, onDecrease, onRemove }: Props) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-ink/40 dark:text-paper/40 text-center py-8">
        Panye a vid. Ajoute yon pwodwi pou kòmanse.
      </p>
    );
  }

  return (
    <div className="rounded-card border border-ink/10 dark:border-dark-border overflow-hidden bg-white dark:bg-dark-surface">
      {items.map((item, i) => (
        <div
          key={item.productId}
          className={`flex items-center gap-3 px-4 py-3 ${
            i > 0 ? "border-t border-ink/8 dark:border-dark-border/60" : ""
          }`}
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{item.name}</p>
            <p className="text-xs text-ink/50 dark:text-paper/50">{fmt(item.unitPrice)} / inite</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onDecrease(item.productId)}
              aria-label={`Diminye kantite ${item.name}`}
              className="w-7 h-7 rounded-full border border-ink/15 dark:border-dark-border flex items-center justify-center"
            >
              <Minus size={13} />
            </button>
            <span className="stat-figure w-6 text-center text-sm">{item.qty}</span>
            <button
              onClick={() => onIncrease(item.productId)}
              disabled={item.qty >= item.stock}
              aria-label={`Ogmante kantite ${item.name}`}
              className="w-7 h-7 rounded-full border border-ink/15 dark:border-dark-border flex items-center justify-center disabled:opacity-30"
            >
              <Plus size={13} />
            </button>
          </div>

          <span className="stat-figure text-sm font-medium w-20 text-right">
            {fmt(item.qty * item.unitPrice)}
          </span>

          <button
            onClick={() => onRemove(item.productId)}
            aria-label={`Retire ${item.name} nan panye a`}
            className="text-brick/70"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}
