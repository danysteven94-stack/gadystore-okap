import type { Metadata } from "next";
import { Suspense } from "react";
import { Track } from "@/components/shop/track";

export const metadata: Metadata = { title: "Swiv kòmand mwen", robots: { index: false } };

export default function TrackPage() {
  return (
    <Suspense fallback={null}>
      <Track />
    </Suspense>
  );
}
