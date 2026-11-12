"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
import { useLanguage } from "@/lib/i18n/language-provider";
import { LANGUAGES } from "@/lib/i18n/dictionary";
import { LogoutButton } from "@/components/nav/logout-button";
import { NAV_ITEMS } from "@/lib/nav-items";
import { useSuperInfo } from "@/lib/use-super-info";

export function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useLanguage();
  const { isSuper, alertCount } = useSuperInfo();

  return (
    <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 h-screen sticky top-0 bg-night text-paper border-r border-white/10">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
        <div className="w-9 h-9 rounded-md bg-white p-0.5 flex items-center justify-center shrink-0">
          <img src="/logo.png" alt="Platfomnou" className="w-full h-full object-contain" />
        </div>
        <div className="min-w-0">
          <p className="text-base font-semibold leading-tight truncate text-white">{t("nav_brand_name")}</p>
          <p className="text-[11px] text-white/60 truncate">
            {t("nav_brand_subtitle")}
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV_ITEMS.filter((i) => !i.superOnly || isSuper).map(({ href, icon: Icon, key }) => {
          const active = pathname === href.split("?")[0];
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                active
                  ? "bg-brick text-white font-medium"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={18} strokeWidth={1.75} className={active ? "" : "text-white/70"} />
              <span className="flex-1">{t(key)}</span>
                        {href === "/user-billing" && alertCount > 0 && (
                          <span className="min-w-5 h-5 px-1.5 rounded-full bg-brick text-white text-[11px] font-bold flex items-center justify-center">{alertCount}</span>
                        )}
              {active && <ChevronRight size={18} />}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/10 space-y-1">
        <div className="flex items-center justify-between px-2">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 text-xs text-white/60 hover:text-paper"
          >
            {theme === "light" ? <Moon size={14} /> : <Sun size={14} />}
            {theme === "light" ? t("nav_dark_mode") : t("nav_light_mode")}
          </button>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as typeof lang)}
            className="text-xs bg-transparent text-white/60 border-none focus:outline-none"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code} className="text-ink">
                {l.label}
              </option>
            ))}
          </select>
        </div>
        <LogoutButton className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/60 hover:bg-white/5 hover:text-paper w-full text-left" />
      </div>
    </aside>
  );
}
