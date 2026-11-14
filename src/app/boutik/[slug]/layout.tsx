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
  return {
    title: { default: `${shop.name} — Boutik`, template: `%s · ${shop.name}` },
    description: `${shop.tagline}. Gade pwodwi yo epi kòmande sou entènèt.`,
    openGraph: { title: shop.name, description: `${shop.tagline}. Kòmande sou entènèt.`, type: "website" },
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
