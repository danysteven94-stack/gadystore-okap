"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useShop, useT } from "./shop-context";
import { ProductCard } from "./product-card";
import { C } from "./ui";

export function Wishlist() {
  const t = useT();
  const { base, wish, byId } = useShop();
  const items = wish.map((id) => byId.get(id)).filter((p): p is NonNullable<typeof p> => !!p);
  return (
    <main className="max-w-6xl mx-auto px-4 py-6 pb-16">
      <h1 className="text-2xl font-bold mb-5">{t("Favori mwen ({n})", { n: items.length })}</h1>
      {items.length === 0 ? (
        <div className="text-center py-20">
          <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: C.soft }}><Heart size={28} /></div>
          <p className="mb-6" style={{ color: C.muted }}>{t("Ou poko gen favori. Peze kè a sou yon pwodwi pou sove l isit la.")}</p>
          <Link href={base} className="inline-block rounded-xl px-7 py-3.5 font-semibold text-white" style={{ background: C.ink }}>{t("Gade pwodwi yo")}</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {items.map((p, i) => (<ProductCard key={p.id} p={p} index={i} />))}
        </div>
      )}
    </main>
  );
}
