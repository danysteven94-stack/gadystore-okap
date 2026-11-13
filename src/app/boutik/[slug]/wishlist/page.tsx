import type { Metadata } from "next";
import { Wishlist } from "@/components/shop/wishlist";

export const metadata: Metadata = { title: "Favori mwen", robots: { index: false } };

export default function WishlistPage() {
  return <Wishlist />;
}
