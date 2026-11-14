import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicShop } from "@/lib/shop";
import { ProductView } from "@/components/shop/product-view";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string; id: string }> }): Promise<Metadata> {
  const { slug, id } = await params;
  const shop = await getPublicShop(slug);
  const p = shop?.products.find((x) => x.id === id);
  if (!shop || !p) return { title: "Pwodwi pa jwenn" };
  return {
    title: p.name,
    description: p.description || `${p.name} — ${shop.currency} ${p.price.toLocaleString("en-US")}`,
    openGraph: { title: p.name, images: p.imageUrl ? [p.imageUrl] : undefined },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const shop = await getPublicShop(slug);
  if (!shop || !shop.products.some((p) => p.id === id)) notFound();
  return <ProductView id={id} />;
}
