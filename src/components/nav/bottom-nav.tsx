"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingCart, Package, Users, Menu } from "lucide-react";
import { useIsNavActive } from "@/lib/nav-active";
import { useLanguage } from "@/lib/i18n/language-provider";
import type { TranslationKey } from "@/lib/i18n/dictionary";

const TABS: { href: string; match: string; icon: React.ElementType; key: TranslationKey }[] = [
  { href: "/dashboard", match: "/dashboard", icon: LayoutDashboard, key: "nav_dashboard" },
  { href: "/pos", match: "/pos", icon: ShoppingCart, key: "nav_pos" },
  { href: "/products", match: "/products", icon: Package, key: "nav_products" },
  { href: "/contacts?kind=customer", match: "/contacts", icon: Users, key: "nav_customers" },
];

/** Navigasyon anba, style app natif — sèlman sou telefòn/tablèt (< lg). */
export function BottomNav({ onMore }: { onMore: () => void }) {
  const pathname = usePathname();
  const isActive = useIsNavActive();
  const { t } = useLanguage();

  const base = "flex-1 flex flex-col items-center justify-center gap-0.5 min-h-14 text-[11px] font-medium active:bg-white/10";

  return (
    <nav
      aria-label="Navigasyon prensipal"
      className="lg:hidden fixed inset-x-0 bottom-0 z-40 flex bg-ink/95 backdrop-blur text-white border-t border-white/10 pb-[env(safe-area-inset-bottom)]"
    >
      {TABS.map(({ href, match, icon: Icon, key }) => {
        // Onglè Kliyan an pa dwe limen sou paj Founisè a (menm paj /contacts, kind diferan)
        const active = href.includes("?") ? isActive(href) : pathname.startsWith(match);
        return (
          <Link key={href} href={href} className={`${base} ${active ? "text-white font-semibold" : "text-white/60"}`}>
            <span className={`px-4 py-1 rounded-full ${active ? "bg-brick" : ""}`}>
              <Icon size={20} strokeWidth={active ? 2.2 : 1.75} />
            </span>
            <span className="truncate max-w-full px-1">{t(key).replace(" (POS)", "")}</span>
          </Link>
        );
      })}
      <button onClick={onMore} className={`${base} text-white/60`}>
        <span className="px-4 py-1"><Menu size={20} strokeWidth={1.75} /></span>
        <span>{t("nav_more")}</span>
      </button>
    </nav>
  );
}
