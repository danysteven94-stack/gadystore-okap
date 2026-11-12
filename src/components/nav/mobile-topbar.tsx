"use client";

import { Menu, Building2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-provider";

interface Props {
  onOpen: () => void;
}

export function MobileTopbar({ onOpen }: Props) {
  const { t } = useLanguage();

  return (
    <header className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-night text-paper border-b border-white/10">
      <button
        onClick={onOpen}
        aria-label="Louvri meni"
        className="w-9 h-9 -ml-1.5 flex items-center justify-center rounded-lg hover:bg-white/10"
      >
        <Menu size={20} />
      </button>
      <div className="w-9 h-9 rounded-md bg-brick flex items-center justify-center text-white shrink-0">
        <Building2 size={18} strokeWidth={2.2} />
      </div>
      <p className="text-base font-semibold truncate">{t("nav_brand_name")}</p>
    </header>
  );
}
