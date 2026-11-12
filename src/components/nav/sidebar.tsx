"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, ChevronRight, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
import { useLanguage } from "@/lib/i18n/language-provider";
import { LANGUAGES } from "@/lib/i18n/dictionary";
import { LogoutButton } from "@/components/nav/logout-button";
import { NAV_ITEMS } from "@/lib/nav-items";

export function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useLanguage();

  return (
    <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 h-screen sticky top-0 bg-night text-paper border-r border-[#F5B800]/30 shadow-[4px_0_24px_rgba(245,184,0,0.08)]">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#FFD84D] to-[#F5A100] shadow-[0_0_16px_rgba(255,194,26,0.45)] flex items-center justify-center text-night shrink-0">
          <Building2 size={19} strokeWidth={2.2} />
        </div>
        <div className="min-w-0">
          <p className="font-display text-lg leading-tight truncate text-[#FFD84D]">{t("nav_brand_name")}</p>
          <p className="text-[11px] tracking-wide text-paper/80 truncate">
            {t("nav_brand_subtitle")}
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
        {NAV_ITEMS.map(({ href, icon: Icon, key }) => {
          const active = pathname === href.split("?")[0];
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-[15px] transition-colors ${
                active
                  ? "bg-gradient-to-r from-[#FFC21A] to-[#F5A100] text-night font-semibold shadow-[0_0_18px_rgba(255,194,26,0.35)]"
                  : "bg-[#0C1730] border border-[#F5B800]/25 text-paper hover:border-[#F5B800]/60"
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.2 : 1.75} className={active ? "" : "text-[#FFC21A]"} />
              <span className="flex-1">{t(key)}</span>
              {active && <ChevronRight size={18} />}
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
