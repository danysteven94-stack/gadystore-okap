"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/nav/sidebar";
import { MobileTopbar } from "@/components/nav/mobile-topbar";
import { MobileDrawer } from "@/components/nav/mobile-drawer";
import { BottomNav } from "@/components/nav/bottom-nav";

const HIDE_NAV_PREFIXES = ["/login", "/verify", "/boutik", "/change-password", "/privacy", "/terms", "/account-deletion"];

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showNav = !HIDE_NAV_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Siyal pou lòt eleman fiks (ex: bann offline) pou yo monte anlè nav anba a
  useEffect(() => {
    document.body.classList.toggle("has-bottom-nav", showNav);
    return () => document.body.classList.remove("has-bottom-nav");
  }, [showNav]);

  if (!showNav) return <>{children}</>;

  return (
    <div className="lg:flex">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <MobileTopbar onOpen={() => setDrawerOpen(true)} />
        <div className="flex-1 pb-[calc(3.5rem+env(safe-area-inset-bottom))] lg:pb-0">{children}</div>
      </div>
      <BottomNav onMore={() => setDrawerOpen(true)} />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
