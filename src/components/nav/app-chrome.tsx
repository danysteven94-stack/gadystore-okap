"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/nav/bottom-nav";

const HIDE_NAV_PREFIXES = ["/login", "/verify"];

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showNav = !HIDE_NAV_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  return (
    <>
      <div className={showNav ? "pb-16" : ""}>{children}</div>
      {showNav && <BottomNav />}
    </>
  );
}
