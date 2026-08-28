"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingCart, Package, Users, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
import { useLanguage } from "@/lib/i18n/language-provider";
import { LANGUAGES } from "@/lib/i18n/dictionary";

const ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, key: "nav_dashboard" as const },
  { href: "/pos", icon: ShoppingCart, key: "nav_pos" as const },
  { href: "/products", icon: Package, key: "nav_products" as const },
  { href: "/contacts", icon: Users, key: "nav_contacts" as const },
];

export function BottomNav() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useLanguage();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-paper/95 dark:bg-dark-surface/95 backdrop-blur border-t border-ink/10 dark:border-dark-border">
      <div className="max-w-3xl mx-auto flex items-center justify-between px-2 py-1.5">
        <div className="flex flex-1">
          {ITEMS.map(({ href, icon: Icon, key }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-[10px] font-medium transition-colors ${
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
        </div>

        <div className="flex items-center gap-1 pl-2 ml-1 border-l border-ink/10 dark:border-dark-border">
          <button
            onClick={toggleTheme}
            aria-label={theme === "light" ? "Aktive mòd fonse" : "Aktive mòd klè"}
            className="w-8 h-8 flex items-center justify-center rounded-full text-ink/60 dark:text-paper/60"
          >
            {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as typeof lang)}
            aria-label="Chwazi lang"
            className="text-[11px] bg-transparent text-ink/60 dark:text-paper/60 border-none focus:outline-none"
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
