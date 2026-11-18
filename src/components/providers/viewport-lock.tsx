"use client";

import { useEffect } from "react";

/**
 * Bloke zoom ki pa vle sou telefòn (pinch, double-tap) pou app la rete stab.
 * iOS Safari/WebView souvan inyore `user-scalable=no`, kidonk nou bloke jès yo nan JS tou.
 * Defilman (scroll) nòmal pa afekte.
 */
export function ViewportLock() {
  useEffect(() => {
    const stop = (e: Event) => e.preventDefault();

    // iOS: jès pinch
    document.addEventListener("gesturestart", stop);
    document.addEventListener("gesturechange", stop);
    document.addEventListener("gestureend", stop);

    // Android/lòt: de dwèt sou ekran an
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault();
    };
    document.addEventListener("touchmove", onTouchMove, { passive: false });

    // Double-tap: de tap rapid sou menm kote (sof sou chan tèks ak bouton)
    let last = 0;
    const onTouchEnd = (e: TouchEvent) => {
      const now = Date.now();
      const el = e.target as HTMLElement | null;
      const interactive = !!el?.closest("input, textarea, select, button, a, label, [role='button']");
      if (now - last < 300 && !interactive) e.preventDefault();
      last = now;
    };
    document.addEventListener("touchend", onTouchEnd, { passive: false });

    return () => {
      document.removeEventListener("gesturestart", stop);
      document.removeEventListener("gesturechange", stop);
      document.removeEventListener("gestureend", stop);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  return null;
}
