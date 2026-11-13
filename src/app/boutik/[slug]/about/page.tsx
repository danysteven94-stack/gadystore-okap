import type { Metadata } from "next";
import { About } from "@/components/shop/about";

export const metadata: Metadata = { title: "Livrezon, peman ak retou" };

export default function AboutPage() {
  return <About />;
}
