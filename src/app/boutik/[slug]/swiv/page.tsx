import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublicShop } from "@/lib/shop";
import { TrackView } from "@/components/shop/track-view";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Swiv kòmand mwen" };

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!(await getPublicShop(slug))) notFound();
  return (
    <Suspense fallback={<main className="min-h-[60vh]" />}>
      <TrackView />
    </Suspense>
  );
}
