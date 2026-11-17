"use client";

import { usePathname, useSearchParams } from "next/navigation";

/**
 * Di si yon lyen meni aktif. Pou /contacts, "Kliyan" ak "Founisè" se de bagay diferan:
 * se paramèt `kind` nan URL la ki di kilès ki aktif (pa defo = kliyan).
 */
export function useIsNavActive() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return (href: string) => {
    const [path, qs] = href.split("?");
    if (pathname !== path) return false;
    const wanted = new URLSearchParams(qs ?? "").get("kind");
    if (!wanted) return true;
    const current = searchParams.get("kind") === "supplier" ? "supplier" : "customer";
    return current === wanted;
  };
}
