"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/nav/sidebar";
import { MobileTopbar } from "@/components/nav/mobile-topbar";
import { MobileDrawer } from "@/components/nav/mobile-drawer";

const HIDE_NAV_PREFIXES = ["/login", "/verify"];

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showNav = !HIDE_NAV_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (!showNav) return <>{children}</>;

  return (
    <div className="lg:flex">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <MobileTopbar onOpen={() => setDrawerOpen(true)} />
        <div className="flex-1">{children}</div>
      </div>
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
