"use client";

import { useEffect, useState } from "react";

export const NOTIFICATIONS_CHANGED = "notifications:changed";

/** Kantite notifikasyon ki poko li (pou badj nan meni a). Rafrechi lè paj la vin vizib oswa lè yon notifikasyon make li. */
export function useUnreadNotifications() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/notifications?count=1");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setCount(Number(data.unreadCount) || 0);
      } catch {
        /* silans */
      }
    }
    load();
    const onVisible = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener(NOTIFICATIONS_CHANGED, load);
    // 5 minit (olye de 1 minit) epi sèlman lè paj la vizib — ekonomize kòmand Redis.
    const iv = setInterval(() => { if (document.visibilityState === "visible") load(); }, 300000);
    return () => {
      cancelled = true;
      clearInterval(iv);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener(NOTIFICATIONS_CHANGED, load);
    };
  }, []);

  return count;
}
