"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  Users,
  Truck,
  Building2,
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

const ITEMS: { href: string; icon: React.ElementType; key: TranslationKey }[] = [
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

export function BottomNav() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useLanguage();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-paper/95 dark:bg-dark-surface/95 backdrop-blur border-t border-ink/10 dark:border-dark-border">
      <div className="flex items-center gap-1 px-2 py-1.5 overflow-x-auto">
        {ITEMS.map(({ href, icon: Icon, key }) => {
          const active = pathname === href.split("?")[0];
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-lg text-[10px] font-medium shrink-0 transition-colors ${
                active
                  ? "text-forest dark:text-gold-light"
                  : "text-ink/40 dark:text-paper/40"
              }`}
            >
              <Icon size={19} strokeWidth={active ? 2.2 : 1.75} />
              {t(key)}
            </Link>
          );
        })}

        <div className="flex items-center gap-1 pl-2 ml-1 border-l border-ink/10 dark:border-dark-border shrink-0">
          <button
            onClick={toggleTheme}
            aria-label={theme === "light" ? t("nav_dark_mode") : t("nav_light_mode")}
            className="w-8 h-8 flex items-center justify-center rounded-full text-ink/60 dark:text-paper/60 shrink-0"
          >
            {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as typeof lang)}
            aria-label="Chwazi lang"
            className="text-[11px] bg-transparent text-ink/60 dark:text-paper/60 border-none focus:outline-none shrink-0"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </nav>
  );
}
