import type { Metadata } from "next";
import { getPublicShop } from "@/lib/shop";
import { ShopProvider } from "@/components/shop/shop-provider";
import { ShopChrome } from "@/components/shop/shop-chrome";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const shop = await getPublicShop(slug);
  if (!shop) return { title: "Boutik pa jwenn" };
  return {
    title: { default: `${shop.name} — ${shop.tagline}`, template: `%s | ${shop.name}` },
    description: shop.about || shop.tagline,
    openGraph: { title: shop.name, description: shop.tagline, images: shop.coverUrl || shop.logoUrl ? [shop.coverUrl || shop.logoUrl!] : undefined },
  };
}

export default async function ShopLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const shop = await getPublicShop(slug);
  // Si boutik la pa egziste, paj yo rele notFound() epi not-found.tsx la afiche
  if (!shop) return <>{children}</>;
  return (
    <ShopProvider initial={shop}>
      <ShopChrome>{children}</ShopChrome>
    </ShopProvider>
  );
}
