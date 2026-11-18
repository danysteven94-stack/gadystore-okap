"use client";

import { useEffect, useState } from "react";

/** Di si itilizatè a se kont prensipal la, epi konbyen peman ki bezwen atansyon. */
export function useSuperInfo() {
  const [isSuper, setIsSuper] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0); // revni abònman itilizatè yo (kont prensipal la sèlman)
  const [shopAllowed, setShopAllowed] = useState(true); // montre pandan l ap chaje; kache si plan an pa gen boutik

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await fetch("/api/auth/me");
        if (!me.ok) return;
        const info = await me.json();
        if (!cancelled) setShopAllowed(info.shopAllowed !== false);
        const { isSuper } = info;
        if (cancelled || !isSuper) return;
        setIsSuper(true);
        const res = await fetch("/api/user-billing?summary=1");
        if (!res.ok) return;
        const { summary } = await res.json();
        if (cancelled) return;
        setAlertCount((summary?.overdue ?? 0) + (summary?.dueToday ?? 0));
        setMonthlyRevenue(summary?.monthlyRevenue ?? 0);
      } catch {
        /* silans */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { isSuper, alertCount, shopAllowed, monthlyRevenue };
}
