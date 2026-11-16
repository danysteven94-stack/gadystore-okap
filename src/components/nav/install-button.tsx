"use client";

import { useEffect, useState } from "react";
import { Download, MonitorSmartphone } from "lucide-react";

// "beforeinstallprompt" ka tire avan konpozan an monte: nou kenbe l nan yon varyab modil.
interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
let deferred: InstallEvent | null = null;
let installedFlag = false;
const subs = new Set<() => void>();
const notify = () => subs.forEach((f) => f());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as InstallEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    installedFlag = true;
    notify();
  });
}

function browserHelp() {
  const ua = navigator.userAgent;
  if (/edg\//i.test(ua)) return "Nan Edge: klike sou ikòn enstale a nan ba adrès la (oswa meni ⋯ → Apps → Install this site as an app).";
  if (/chrome|chromium/i.test(ua) && !/edg\//i.test(ua)) return "Nan Chrome: klike sou ikòn enstale a nan ba adrès la (oswa meni ⋮ → Cast, save and share → Install page as app).";
  if (/safari/i.test(ua) && /macintosh/i.test(ua)) return "Nan Safari (Mac): meni File → Add to Dock.";
  return "Itilize Chrome oswa Edge sou laptop la, epi klike sou ikòn enstale a nan ba adrès la.";
}

/** Bouton "Enstale app la" — pou laptop/òdinatè (Chrome, Edge) ak telefòn. Kache si app la deja enstale. */
export function InstallButton({ className }: { className?: string }) {
  const [, force] = useState(0);
  const [standalone, setStandalone] = useState(true); // kache pandan nou poko konnen
  const [help, setHelp] = useState<string | null>(null);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: window-controls-overlay)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true ||
      !!(window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.();
    setStandalone(isStandalone);
    const f = () => force((n) => n + 1);
    subs.add(f);
    return () => {
      subs.delete(f);
    };
  }, []);

  if (standalone || installedFlag) return null;

  async function onClick() {
    if (deferred) {
      await deferred.prompt();
      await deferred.userChoice;
      deferred = null;
      notify();
    } else {
      setHelp((h) => (h ? null : browserHelp()));
    }
  }

  return (
    <div>
      <button type="button" onClick={onClick} className={className}>
        {deferred ? <Download size={16} /> : <MonitorSmartphone size={16} />}
        Enstale app la
      </button>
      {help && <p className="px-3 pb-2 text-[11px] leading-snug text-white/50">{help}</p>}
    </div>
  );
}
