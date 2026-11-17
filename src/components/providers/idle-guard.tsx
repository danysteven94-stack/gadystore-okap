"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const IDLE_LIMIT = 60 * 60 * 1000; // 1 èdtan san aktivite
const REFRESH_EVERY = 5 * 60 * 1000; // re-bay sesyon an chak 5 min si aktif
const KEY = "lastActivityAt";
const PUBLIC = ["/login", "/boutik", "/verify", "/privacy", "/terms", "/account-deletion"];

function getLast(): number {
  try { return Number(localStorage.getItem(KEY)) || Date.now(); } catch { return Date.now(); }
}
function setLast(t: number) {
  try { localStorage.setItem(KEY, String(t)); } catch {}
}

/**
 * Dekonekte itilizatè a apre 1 èdtan san aktivite (tout tab yo pataje menm revèy la),
 * epi voye l nan /login. Lè l tounen li konekte ankò. Pa efase done offline yo
 * (operasyon ki poko senkronize yo rete pou apre rekoneksyon).
 */
export function IdleGuard() {
  const pathname = usePathname();
  const lastRefresh = useRef(0);
  const isPublic = PUBLIC.some((p) => pathname === "/" || pathname.startsWith(p));

  useEffect(() => {
    if (isPublic) return;
    setLast(Date.now());

    async function logout() {
      try { await fetch("/api/auth/logout", { method: "POST" }); } catch {}
      window.location.href = "/login?expired=1";
    }

    function refresh() {
      const now = Date.now();
      if (now - lastRefresh.current < REFRESH_EVERY) return;
      lastRefresh.current = now;
      fetch("/api/auth/refresh", { method: "POST" })
        .then((r) => { if (r.status === 401) logout(); })
        .catch(() => {}); // offline: pa dekonekte
    }

    function onActivity() {
      setLast(Date.now());
      refresh();
    }

    function check() {
      if (Date.now() - getLast() >= IDLE_LIMIT) logout();
    }

    const events = ["pointerdown", "keydown", "scroll", "touchstart", "visibilitychange"];
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    const timer = setInterval(check, 30 * 1000);
    check(); // si onglè a te dòmi/fèmen plis pase 1 èdtan
    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity));
      clearInterval(timer);
    };
  }, [isPublic, pathname]);

  return null;
}
