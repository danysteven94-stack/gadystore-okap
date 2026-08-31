"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/nav/bottom-nav";
import { Sidebar } from "@/components/nav/sidebar";

const HIDE_NAV_PREFIXES = ["/login", "/verify"];

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showNav = !HIDE_NAV_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (!showNav) return <>{children}</>;

  return (
    <div className="lg:flex">
      <Sidebar />
      <div className="flex-1 min-w-0 pb-16 lg:pb-0">{children}</div>
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </div>
  );
}
