"use client";

import { useEffect } from "react";
import { currentPermission, enablePush, isInstalledApp, isNative, PUSH_CHANGED } from "@/lib/push-client";

const ATTEMPTS_KEY = "push:auto-attempts";
const MAX_ATTEMPTS = 3; // pa anbete moun nan si l kontinye inyore demann lan

/**
 * Aktive notifikasyon otomatikman lè app la enstale (ekran dakèy / laptop / app natif).
 *  - App natif: demann pèmisyon an parèt dirèkteman.
 *  - PWA: navigatè yo (sitou iOS) mande yon aksyon itilizatè, kidonk demann lan parèt nan premye tap apre ouvèti a.
 *  - Si pèmisyon an deja akòde: aparèy la re-anrejistre an silans.
 *  - Si moun nan refize, nou pa mande ankò.
 * Sèlman moun ki konekte (AppChrome monte l sèlman lè meni an parèt).
 */
export function AutoPushSetup() {
  useEffect(() => {
    let cancelled = false;
    let removeGesture: (() => void) | null = null;

    const attempts = () => Number(localStorage.getItem(ATTEMPTS_KEY) || 0);

    async function prompt() {
      localStorage.setItem(ATTEMPTS_KEY, String(attempts() + 1));
      await enablePush();
      window.dispatchEvent(new Event(PUSH_CHANGED));
    }

    async function run(justInstalled = false) {
      if (cancelled) return;
      if (!justInstalled && !isInstalledApp()) return;
      const perm = await currentPermission();
      if (cancelled || perm === "unsupported" || perm === "denied") return;

      if (perm === "granted") {
        await enablePush(); // pa gen demann: sèlman re-anrejistre aparèy la
        window.dispatchEvent(new Event(PUSH_CHANGED));
        return;
      }

      if (attempts() >= MAX_ATTEMPTS) return;
      if (isNative()) {
        await prompt();
        return;
      }
      // Web: demann nan dwe soti nan yon jès itilizatè → premye tap
      removeGesture?.();
      const onGesture = () => {
        removeGesture = null;
        void prompt();
      };
      document.addEventListener("pointerup", onGesture, { once: true });
      removeGesture = () => document.removeEventListener("pointerup", onGesture);
    }

    const onInstalled = () => void run(true);
    window.addEventListener("appinstalled", onInstalled);
    void run();

    return () => {
      cancelled = true;
      removeGesture?.();
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  return null;
}
