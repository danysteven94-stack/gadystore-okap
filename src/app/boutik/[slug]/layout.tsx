import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicShop } from "@/lib/shop";
import { ShopProvider } from "@/components/shop/shop-context";
import { ShopShell } from "@/components/shop/shop-shell";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const shop = await getPublicShop(slug);
  if (!shop) return { title: "Boutik pa jwenn" };
  const logoV = shop.logoUrl?.match(/[0-9a-f-]{36}/i)?.[0]?.slice(0, 8) ?? "0";
  return {
    title: { default: `${shop.name} — Boutik`, template: `%s · ${shop.name}` },
    description: `${shop.tagline}. Gade pwodwi yo epi kòmande sou entènèt.`,
    openGraph: { title: shop.name, description: `${shop.tagline}. Kòmande sou entènèt.`, type: "website" },
    // PWA: chak boutik gen pwòp manifest, non ak ikòn (logo boutik la) — pa sa Platfomnou an.
    manifest: `/api/shop/${slug}/manifest`,
    applicationName: shop.name,
    appleWebApp: { capable: true, title: shop.name.slice(0, 20), statusBarStyle: "default" },
    icons: {
      icon: [{ url: `/api/shop/${slug}/icon?size=192&v=${logoV}`, sizes: "192x192", type: "image/png" }],
      apple: [{ url: `/api/shop/${slug}/icon?size=180&v=${logoV}`, sizes: "180x180", type: "image/png" }],
    },
  };
}

// Layout la chaje boutik la yon sèl fwa; li rete menm lè kliyan an navige ant paj yo (panye a pa pèdi).
export default async function BoutikLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const shop = await getPublicShop(slug);
  if (!shop) notFound();
  return (
    <ShopProvider initial={shop}>
      <ShopShell>{children}</ShopShell>
    </ShopProvider>
  );
}
