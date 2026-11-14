"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Share, SquarePlus, X } from "lucide-react";
import { useShop } from "./shop-context";
import { C, Sheet } from "./ui";

// "beforeinstallprompt" ka tire trè bonè, avan konpozan an monte: nou kenbe l nan yon varyab modil.
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

export function useInstall() {
  const [, force] = useState(0);
  const [env, setEnv] = useState({ ios: false, standalone: false, native: false });

  useEffect(() => {
    const ua = navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
    const native = !!(window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.();
    setEnv({ ios, standalone, native });
    const f = () => force((n) => n + 1);
    subs.add(f);
    return () => {
      subs.delete(f);
    };
  }, []);

  const installed = env.standalone || env.native || installedFlag;
  const canPrompt = !!deferred;

  const prompt = useCallback(async () => {
    if (!deferred) return false;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    deferred = null;
    notify();
    return outcome === "accepted";
  }, []);

  return { installed, canPrompt, ios: env.ios, prompt };
}

/** Eksplikasyon pou iPhone/iPad (Safari pa gen bouton enstale otomatik) ak lòt navigatè. */
function HowToSheet({ onClose, ios }: { onClose: () => void; ios: boolean }) {
  const { shop } = useShop();
  return (
    <Sheet onClose={onClose}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold pr-6">Mete {shop.name} sou ekran an</h3>
        <button onClick={onClose} aria-label="Fèmen" className="p-1"><X size={22} /></button>
      </div>
      {ios ? (
        <ol className="space-y-4 text-[15px]">
          <li className="flex gap-3"><span className="font-bold">1.</span><span>Louvri paj sa a nan <b>Safari</b>, epi peze bouton <b>Pataje</b> <Share size={16} className="inline -mt-1" /> anba a.</span></li>
          <li className="flex gap-3"><span className="font-bold">2.</span><span>Chwazi <b>« Sou ekran dakèy » / « Add to Home Screen »</b> <SquarePlus size={16} className="inline -mt-1" />.</span></li>
          <li className="flex gap-3"><span className="font-bold">3.</span><span>Peze <b>Ajoute</b>. Logo {shop.name} ap parèt sou telefòn ou kou yon vrè app.</span></li>
        </ol>
      ) : (
        <ol className="space-y-4 text-[15px]">
          <li className="flex gap-3"><span className="font-bold">1.</span><span>Louvri meni navigatè a (<b>⋮</b> nan Chrome).</span></li>
          <li className="flex gap-3"><span className="font-bold">2.</span><span>Chwazi <b>« Enstale app »</b> oswa <b>« Ajoute sou ekran dakèy »</b>.</span></li>
          <li className="flex gap-3"><span className="font-bold">3.</span><span>Konfime. Logo {shop.name} ap parèt sou telefòn ou.</span></li>
        </ol>
      )}
      <button onClick={onClose} className="mt-6 w-full rounded-full py-3.5 font-semibold text-white" style={{ background: C.ink }}>
        Konprann
      </button>
    </Sheet>
  );
}

/** Bouton "Enstale app la" (pou paj Setting). Kache si app la deja enstale. */
export function InstallButton({ className = "" }: { className?: string }) {
  const { shop } = useShop();
  const { installed, canPrompt, ios, prompt } = useInstall();
  const [help, setHelp] = useState(false);

  if (installed) {
    return <p className="text-sm font-medium" style={{ color: C.ok }}>✓ App la deja enstale sou aparèy sa a.</p>;
  }
  return (
    <>
      <button
        onClick={async () => (canPrompt ? await prompt() : setHelp(true))}
        className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 font-semibold text-white ${className}`}
        style={{ background: C.ink }}
      >
        <Download size={18} /> Enstale app {shop.name}
      </button>
      {help && <HowToSheet ios={ios} onClose={() => setHelp(false)} />}
    </>
  );
}

/** Ti bann ki pwopoze enstale app la (yon fwa chak 14 jou si kliyan an fèmen l). */
export function InstallBanner() {
  const { shop } = useShop();
  const { installed, canPrompt, ios, prompt } = useInstall();
  const [hidden, setHidden] = useState(true);
  const [help, setHelp] = useState(false);
  const key = `pwa-dismiss:${shop.slug}`;

  useEffect(() => {
    try {
      const t = Number(localStorage.getItem(key) || 0);
      setHidden(Date.now() - t < 14 * 86400000);
    } catch {
      setHidden(false);
    }
  }, [key]);

  function dismiss() {
    setHidden(true);
    try {
      localStorage.setItem(key, String(Date.now()));
    } catch {
      /* ignore */
    }
  }

  // Montre l sèlman si navigatè a ka enstale (Chrome/Android) oswa se iPhone
  if (installed || hidden || !(canPrompt || ios)) return null;

  return (
    <>
      <div
        className="fixed z-50 left-3 right-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:left-auto md:right-6 md:bottom-6 md:w-96 rounded-2xl bg-white border shadow-2xl p-3 flex items-center gap-3"
        style={{ borderColor: C.line }}
      >
        <span className="w-11 h-11 rounded-xl overflow-hidden shrink-0 flex items-center justify-center font-bold text-white" style={{ background: C.ink }}>
          {shop.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shop.logoUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            shop.name.trim().charAt(0).toUpperCase()
          )}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate">Enstale app {shop.name}</p>
          <p className="text-xs" style={{ color: C.muted }}>Mete l sou ekran telefòn ou, ouvri l tousuit.</p>
        </div>
        <button
          onClick={async () => {
            if (canPrompt) {
              if (await prompt()) dismiss();
            } else setHelp(true);
          }}
          className="rounded-full px-4 py-2 text-sm font-semibold text-white shrink-0"
          style={{ background: C.ink }}
        >
          Enstale
        </button>
        <button onClick={dismiss} aria-label="Fèmen" className="p-1 shrink-0"><X size={18} /></button>
      </div>
      {help && <HowToSheet ios={ios} onClose={() => { setHelp(false); dismiss(); }} />}
    </>
  );
}
