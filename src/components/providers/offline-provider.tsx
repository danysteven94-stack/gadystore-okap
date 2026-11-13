"use client";

import { useEffect, useState } from "react";
import { WifiOff, RefreshCw, AlertTriangle, X } from "lucide-react";
import {
  installOfflineFetch, setOnline, subscribe, getState, syncQueue, refreshCounts, warmup, discardFailed,
  type OfflineState,
} from "@/lib/offline/offline-fetch";

// DWE kouri nan evalyasyon modil la (anvan efè timoun yo) pou premye fetch yo pase pa kouch offline la.
if (typeof window !== "undefined") installOfflineFetch();

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [s, setS] = useState<OfflineState>(getState());

  useEffect(() => {
    const unsub = subscribe(setS);
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    refreshCounts().then(() => syncQueue());
    const warm = setTimeout(() => warmup(), 3000);

    const onOnline = () => { setOnline(true); syncQueue(); setTimeout(() => warmup(), 2000); };
    const onVisible = () => { if (document.visibilityState === "visible") syncQueue(); };
    window.addEventListener("online", onOnline);
    const onOffline = () => setOnline(false);
    window.addEventListener("offline", onOffline);
    document.addEventListener("visibilitychange", onVisible);
    const iv = setInterval(() => { if (getState().pending > 0) syncQueue(); }, 30000);

    return () => {
      unsub(); clearTimeout(warm); clearInterval(iv);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  // Pa montre mesaj "mòd offline" ankò — bann nan parèt sèlman si gen operasyon k ap tann oswa ki echwe.
  const show = s.pending > 0 || s.failed.length > 0;

  return (
    <>
      {children}
      {show && (
        <div
          style={{ bottom: "var(--bottom-nav-h, 0px)" }}
          className="fixed inset-x-0 z-[60] px-3 pb-2 pointer-events-none"
          role="status"
        >
          <div className="pointer-events-auto max-w-md mx-auto rounded-lg bg-night text-white text-xs shadow-lg border border-white/10 overflow-hidden">
            {s.pending > 0 && (
              <div className="flex items-center gap-2 px-3 py-2">
                {s.syncing ? <RefreshCw size={14} className="animate-spin shrink-0" /> : <WifiOff size={14} className="shrink-0" />}
                <p>
                  {s.online ? "Ap senkronize…" : "Ap tann entènèt."} {s.pending} operasyon an atant.
                </p>
              </div>
            )}
            {s.failed.map((f) => (
              <div key={f.id} className="flex items-start gap-2 px-3 py-2 border-t border-white/10 bg-brick/30">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <p className="flex-1">{f.label} pa t ka senkronize: {f.error}</p>
                <button aria-label="Retire" onClick={() => discardFailed(f.id)}><X size={14} /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
