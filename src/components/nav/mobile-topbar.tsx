"use client";

import { Menu } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-provider";

interface Props {
  onOpen: () => void;
}

export function MobileTopbar({ onOpen }: Props) {
  const { t } = useLanguage();

  return (
    <header className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] bg-night text-paper border-b border-white/10">
      <button
        onClick={onOpen}
        aria-label="Louvri meni"
        className="w-9 h-9 -ml-1.5 flex items-center justify-center rounded-lg hover:bg-white/10"
      >
        <Menu size={20} />
      </button>
      <div className="w-9 h-9 rounded-md bg-white p-0.5 flex items-center justify-center shrink-0">
        <img src="/logo.png" alt="Platfomnou" className="w-full h-full object-contain" />
      </div>
      <p className="text-base font-semibold truncate">{t("nav_brand_name")}</p>
    </header>
  );
}
