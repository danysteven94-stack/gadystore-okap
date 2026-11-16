import { Suspense } from "react";
import { ShopHome } from "@/components/shop/menu";

export default function BoutikPage() {
  return (
    <Suspense fallback={null}>
      <ShopHome />
    </Suspense>
  );
}
