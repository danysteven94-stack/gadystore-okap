"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useShop } from "./shop-provider";
import { ProductCard } from "./product-card";
import { C } from "./ui";

export function WishlistView() {
  const { base, wishlist, byId, hydrated } = useShop();
  const items = wishlist.map((id) => byId.get(id)).filter((p): p is NonNullable<typeof p> => !!p);

  if (!hydrated) return <main className="max-w-7xl mx-auto px-4 py-20" />;

  return (
    <main className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-5">Lis anvi mwen ({items.length})</h1>
      {items.length === 0 ? (
        <div className="py-20 text-center">
          <Heart size={44} className="mx-auto mb-4" style={{ color: C.line }} />
          <p className="font-bold text-lg mb-1">Lis ou vid</p>
          <p className="mb-6 text-sm" style={{ color: C.muted }}>Tape kè a sou yon pwodwi pou w jwenn li isit la pita.</p>
          <Link href={base} className="inline-block rounded-lg px-7 py-3.5 font-bold text-white" style={{ background: C.ink }}>Wè pwodwi yo</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-3 gap-y-7 sm:gap-x-5">
          {items.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      )}
    </main>
  );
}
