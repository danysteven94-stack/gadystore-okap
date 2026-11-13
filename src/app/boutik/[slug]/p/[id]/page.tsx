import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getPublicProduct } from "@/lib/shop";
import { ProductView } from "@/components/shop/product-view";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string; id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug, id } = await params;
  const r = await getPublicProduct(slug, id);
  if (!r) return { title: "Pwodwi pa jwenn" };
  const { product: p } = r;
  const desc = p.description?.slice(0, 160) || `${p.name} — ${p.price.toLocaleString("en-US")} ${r.currency}`;
  return {
    title: p.name,
    description: desc,
    openGraph: { title: `${p.name} · ${r.shopName}`, description: desc, images: p.imageUrl ? [p.imageUrl] : undefined },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug, id } = await params;
  const r = await getPublicProduct(slug, id);
  if (!r) notFound();
  const { product: p } = r;

  // Done estriktire pou Google (rezilta ak pri/disponibilite)
  const ld = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description ?? undefined,
    brand: p.brand ? { "@type": "Brand", name: p.brand } : undefined,
    category: p.category,
    offers: {
      "@type": "Offer",
      price: p.price,
      priceCurrency: r.currency,
      availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    aggregateRating:
      p.ratingCount > 0 ? { "@type": "AggregateRating", ratingValue: p.rating, reviewCount: p.ratingCount } : undefined,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <Suspense fallback={null}>
        <ProductView productId={id} />
      </Suspense>
    </>
  );
}
