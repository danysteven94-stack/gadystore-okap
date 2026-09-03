"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();

  async function handleLogout() {
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
      Dekonekte
    </button>
  );
}
