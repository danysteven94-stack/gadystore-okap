"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-provider";
import * as push from "@/lib/push-client";
import { PUSH_CHANGED } from "@/lib/push-client";

type State = "loading" | "unsupported" | "off" | "on" | "denied";

const { isNative, registerNative, post } = push;

export function PushToggle({ className }: { className?: string }) {
  const { t } = useLanguage();
  const [state, setState] = useState<State>("loading");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const run = async () => {
      try {
        if (isNative()) {
          const { FirebaseMessaging } = await import("@capacitor-firebase/messaging");
          const p = await FirebaseMessaging.checkPermissions();
          if (p.receive === "granted") { await registerNative().catch(() => {}); setState("on"); }
          else setState(p.receive === "denied" ? "denied" : "off");
          return;
        }
        if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
          setState("unsupported");
          return;
        }
        if (Notification.permission === "denied") return setState("denied");
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = await reg?.pushManager.getSubscription();
        if (sub && Notification.permission === "granted") {
          await post({ kind: "web", subscription: sub.toJSON() }).catch(() => {}); // re-sinkronize
          setState("on");
        } else setState("off");
      } catch {
        setState("unsupported");
      }
    };
    void run();
    window.addEventListener(PUSH_CHANGED, run);
    return () => window.removeEventListener(PUSH_CHANGED, run);
  }, []);

  async function enable() {
    setMsg("");
    const res = await push.enablePush();
    if (res === "on") return setState("on");
    if (res === "denied") return setState("denied");
    if (res === "error") return setMsg("Erè — eseye ankò.");
    setState("off");
  }

  async function disable() {
    try {
      if (isNative()) {
        const { FirebaseMessaging } = await import("@capacitor-firebase/messaging");
        const { token } = await FirebaseMessaging.getToken();
        await FirebaseMessaging.deleteToken();
        await fetch("/api/push", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
      } else {
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = await reg?.pushManager.getSubscription();
        if (sub) {
          await fetch("/api/push", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) });
          await sub.unsubscribe();
        }
      }
    } catch {}
    setState("off");
  }

  async function test() {
    setMsg("…");
    try {
      const res = await fetch("/api/push/test", { method: "POST" });
      const d = await res.json();
      const n = (d.sent?.web ?? 0) + (d.sent?.native ?? 0);
      setMsg(n > 0 ? "✅" : "Pa gen aparèy ki resevwa. Verifye konfigirasyon sèvè a.");
    } catch {
      setMsg("Erè rezo.");
    }
    setTimeout(() => setMsg(""), 4000);
  }

  if (state === "loading") return null;
  const isIos = typeof navigator !== "undefined" && /iPhone|iPad/.test(navigator.userAgent);

  if (state === "unsupported") {
    return isIos ? (
      <p className="px-3 py-2 text-xs text-white/50">{t("push_ios_hint")}</p>
    ) : null;
  }
  if (state === "denied") {
    return (
      <p className="flex items-center gap-3 px-3 py-2 text-xs text-white/50">
        <BellOff size={16} /> {t("push_denied")}
      </p>
    );
  }

  return (
    <div>
      {state === "off" ? (
        <button onClick={enable} className={className}>
          <Bell size={18} /> {t("push_enable")}
        </button>
      ) : (
        <>
          <button onClick={disable} className={className}>
            <BellRing size={18} /> {t("push_on")}
          </button>
          <button onClick={test} className="px-3 pb-1 text-xs text-white/50 underline underline-offset-2">
            {t("push_test")}
          </button>
        </>
      )}
      {msg && <p className="px-3 text-xs text-white/60">{msg}</p>}
    </div>
  );
}
