"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Moon, Sun, X } from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
import { useLanguage } from "@/lib/i18n/language-provider";
import { LANGUAGES } from "@/lib/i18n/dictionary";
import { LogoutButton } from "@/components/nav/logout-button";
import { NAV_ITEMS } from "@/lib/nav-items";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function MobileDrawer({ open, onClose }: Props) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useLanguage();

  return (
    <div
      className={`lg:hidden fixed inset-0 z-50 transition-opacity duration-200 ${
        open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      aria-hidden={!open}
    >
      <div onClick={onClose} className="absolute inset-0 bg-black/50" />

      <aside
        className={`absolute top-0 left-0 h-full w-72 max-w-[85vw] bg-ink dark:bg-dark-surface text-paper flex flex-col transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-3 min-w-0">
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
          <button
            onClick={onClose}
            aria-label={t("common_close")}
            className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map(({ href, icon: Icon, key }) => {
            const active = pathname === href.split("?")[0];
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
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
    </div>
  );
}
