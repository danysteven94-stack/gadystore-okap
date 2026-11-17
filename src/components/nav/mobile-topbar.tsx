"use client";

import Link from "next/link";
import { Menu, Bell } from "lucide-react";
import { useUnreadNotifications } from "@/lib/use-unread-notifications";
import { useLanguage } from "@/lib/i18n/language-provider";

interface Props {
  onOpen: () => void;
}

export function MobileTopbar({ onOpen }: Props) {
  const { t } = useLanguage();
  const unread = useUnreadNotifications();

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
      <p className="text-base font-semibold truncate flex-1">{t("nav_brand_name")}</p>
      <Link
        href="/notifications"
        aria-label={t("nav_notifications")}
        className="relative w-9 h-9 -mr-1.5 shrink-0 flex items-center justify-center rounded-lg hover:bg-white/10"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute top-0.5 right-0 min-w-4 h-4 px-1 rounded-full bg-brick text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </Link>
    </header>
  );
}
