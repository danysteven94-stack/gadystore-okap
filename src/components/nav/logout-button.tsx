"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { getPendingCount, clearOfflineData } from "@/lib/offline/offline-fetch";
import { useLanguage } from "@/lib/i18n/language-provider";

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const { t } = useLanguage();

  async function handleLogout() {
    const pending = await getPendingCount();
    if (pending > 0 && !confirm(`${pending} operasyon poko senkronize (fèt offline). Si ou dekonekte kounye a, ou ka pèdi yo. Kontinye?`)) return;
    await clearOfflineData();
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Kontinye kanmenm — redireksyon an ap fòse retounen nan login
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <button onClick={handleLogout} className={className}>
      <LogOut size={17} strokeWidth={1.75} />
      {t("nav_logout")}
    </button>
  );
}
