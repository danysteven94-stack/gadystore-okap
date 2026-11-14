import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getPublicShop } from "@/lib/shop";
import { Catalog } from "@/components/shop/catalog";

export const dynamic = "force-dynamic";

export default async function ShopHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!(await getPublicShop(slug))) notFound();
  return (
    <Suspense fallback={<main className="min-h-[60vh]" />}>
      <Catalog />
    </Suspense>
  );
}
