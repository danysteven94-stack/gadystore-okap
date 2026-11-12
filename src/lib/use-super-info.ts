"use client";

import { useEffect, useState } from "react";

/** Di si itilizatè a se kont prensipal la, epi konbyen peman ki bezwen atansyon. */
export function useSuperInfo() {
  const [isSuper, setIsSuper] = useState(false);
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await fetch("/api/auth/me");
        if (!me.ok) return;
        const { isSuper } = await me.json();
        if (cancelled || !isSuper) return;
        setIsSuper(true);
        const res = await fetch("/api/user-billing?summary=1");
        if (!res.ok) return;
        const { summary } = await res.json();
        if (!cancelled) setAlertCount((summary?.overdue ?? 0) + (summary?.dueToday ?? 0));
      } catch {
        /* silans */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { isSuper, alertCount };
}
