import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicShop } from "@/lib/shop";
import { Storefront } from "@/components/shop/storefront";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const shop = await getPublicShop(slug);
  if (!shop) return { title: "Boutik pa jwenn" };
  return {
    title: `${shop.name} — Boutik`,
    description: `${shop.tagline}. Gade pwodwi yo epi kòmande sou entènèt.`,
    openGraph: { title: shop.name, description: `${shop.tagline}. Kòmande sou entènèt.` },
  };
}

export default async function BoutikPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const shop = await getPublicShop(slug);
  if (!shop) notFound();
  return <Storefront initial={shop} />;
}
