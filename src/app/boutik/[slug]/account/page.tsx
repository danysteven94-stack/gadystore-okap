import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountPage } from "@/components/shop/account";

export const metadata: Metadata = { title: "Kont mwen", robots: { index: false } };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AccountPage />
    </Suspense>
  );
}
