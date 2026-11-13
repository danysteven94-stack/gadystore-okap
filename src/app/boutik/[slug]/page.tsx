import { Suspense } from "react";
import { Catalog } from "@/components/shop/catalog";

export default function BoutikPage() {
  return (
    <Suspense fallback={null}>
      <Catalog />
    </Suspense>
  );
}
