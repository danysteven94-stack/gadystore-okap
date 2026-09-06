"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Package,
  Boxes,
  Users,
  Truck,
  ShoppingCart,
  Undo2,
  Receipt,
  BarChart3,
  DatabaseBackup,
  UserCog,
  ClipboardList,
  MonitorPlay,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
import { useLanguage } from "@/lib/i18n/language-provider";
import { LANGUAGES, type TranslationKey } from "@/lib/i18n/dictionary";
import { LogoutButton } from "@/components/nav/logout-button";

const NAV: { href: string; icon: React.ElementType; key: TranslationKey }[] = [
  { href: "/dashboard", icon: LayoutDashboard, key: "nav_dashboard" },
  { href: "/businesses", icon: Building2, key: "nav_businesses" },
  { href: "/products", icon: Package, key: "nav_products" },
  { href: "/stock", icon: Boxes, key: "nav_stock" },
  { href: "/contacts?kind=customer", icon: Users, key: "nav_customers" },
  { href: "/contacts?kind=supplier", icon: Truck, key: "nav_suppliers" },
  { href: "/pos", icon: ShoppingCart, key: "nav_pos" },
  { href: "/orders", icon: ClipboardList, key: "nav_orders" },
  { href: "/subscriptions", icon: MonitorPlay, key: "nav_subscriptions" },
  { href: "/returns", icon: Undo2, key: "nav_returns" },
  { href: "/expenses", icon: Receipt, key: "nav_expenses" },
  { href: "/reports", icon: BarChart3, key: "nav_reports" },
  { href: "/backup", icon: DatabaseBackup, key: "nav_backup" },
  { href: "/users", icon: UserCog, key: "nav_users" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useLanguage();

  return (
    <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 h-screen sticky top-0 bg-ink dark:bg-dark-surface text-paper border-r border-white/5">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="w-10 h-10 rounded-xl bg-gold flex items-center justify-center text-ink shrink-0">
          <Building2 size={19} strokeWidth={2.2} />
        </div>
        <div className="min-w-0">
          <p className="font-display text-base leading-tight truncate">{t("nav_brand_name")}</p>
          <p className="text-[10px] uppercase tracking-wide text-paper/50 truncate">
            {t("nav_brand_subtitle")}
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {NAV.map(({ href, icon: Icon, key }) => {
          const active = pathname === href.split("?")[0];
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-gold/15 text-gold-light font-medium"
                  : "text-paper/70 hover:bg-white/5 hover:text-paper"
              }`}
            >
              <Icon size={17} strokeWidth={active ? 2.2 : 1.75} />
              {t(key)}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/10 space-y-2">
        <div className="flex items-center justify-between px-2">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 text-xs text-paper/60 hover:text-paper"
          >
            {theme === "light" ? <Moon size={14} /> : <Sun size={14} />}
            {theme === "light" ? t("nav_dark_mode") : t("nav_light_mode")}
          </button>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as typeof lang)}
            className="text-xs bg-transparent text-paper/60 border-none focus:outline-none"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code} className="text-ink">
                {l.label}
              </option>
            ))}
          </select>
        </div>
        <LogoutButton className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-paper/60 hover:bg-white/5 hover:text-paper w-full text-left" />
      </div>
    </aside>
  );
}
