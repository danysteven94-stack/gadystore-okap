import type { Metadata } from "next";
import { Checkout } from "@/components/shop/checkout";

export const metadata: Metadata = { title: "Pase kòmand lan", robots: { index: false } };

export default function CheckoutPage() {
  return <Checkout />;
}
