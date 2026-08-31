"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Package,
  Users,
  ShoppingCart,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
import { useLanguage } from "@/lib/i18n/language-provider";
import { LANGUAGES } from "@/lib/i18n/dictionary";

const NAV = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Tablo Debò" },
  { href: "/businesses", icon: Building2, label: "Antrepriz" },
  { href: "/products", icon: Package, label: "Pwodwi & Stok" },
  { href: "/contacts", icon: Users, label: "Kliyan & Founisè" },
  { href: "/pos", icon: ShoppingCart, label: "Vant (POS)" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang } = useLanguage();

  return (
    <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 h-screen sticky top-0 bg-ink dark:bg-dark-surface text-paper border-r border-white/5">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="w-10 h-10 rounded-xl bg-gold flex items-center justify-center font-display text-lg text-ink shrink-0">
          G
        </div>
        <div className="min-w-0">
          <p className="font-display text-base leading-tight truncate">Gady&apos;s</p>
          <p className="text-[10px] uppercase tracking-wide text-paper/50 truncate">
            Gestion Komèsyal
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {NAV.map(({ href, icon: Icon, label }) => {
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
              {label}
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
            {theme === "light" ? "Mòd fonse" : "Mòd klè"}
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
        <Link
          href="/login"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-paper/60 hover:bg-white/5 hover:text-paper"
        >
          <LogOut size={17} strokeWidth={1.75} />
          Dekonekte
        </Link>
      </div>
    </aside>
  );
}
