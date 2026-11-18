"use client";

// Lojik push pataje ant bouton "Aktive notifikasyon" (PushToggle) ak aktivasyon otomatik (AutoPushSetup).

export const PUSH_CHANGED = "push:changed";

type Cap = { isNativePlatform?: () => boolean; getPlatform?: () => string };
const cap = () => (typeof window !== "undefined" ? (window as unknown as { Capacitor?: Cap }).Capacitor : undefined);

export function isNative() {
  return !!cap()?.isNativePlatform?.();
}
function platform(): "ios" | "android" {
  return cap()?.getPlatform?.() === "ios" ? "ios" : "android";
}

/** App la enstale (PWA sou ekran dakèy/laptop, oswa app natif). */
export function isInstalledApp() {
  if (typeof window === "undefined") return false;
  return (
    isNative() ||
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: window-controls-overlay)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function b64ToUint8(b64: string) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export const post = (body: unknown) =>
  fetch("/api/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

let nativeListenerAdded = false;
export async function registerNative() {
  const { FirebaseMessaging } = await import("@capacitor-firebase/messaging");
  const { token } = await FirebaseMessaging.getToken();
  await post({ kind: "native", token, platform: platform() });
  if (!nativeListenerAdded) {
    nativeListenerAdded = true;
    FirebaseMessaging.addListener("notificationActionPerformed", (ev) => {
      const url = (ev.notification?.data as { url?: string } | undefined)?.url;
      if (url && url.startsWith("/")) window.location.href = url;
    });
  }
  return token;
}

export type PushPermission = "granted" | "denied" | "default" | "unsupported";

export async function currentPermission(): Promise<PushPermission> {
  try {
    if (isNative()) {
      const { FirebaseMessaging } = await import("@capacitor-firebase/messaging");
      const p = await FirebaseMessaging.checkPermissions();
      return p.receive === "granted" ? "granted" : p.receive === "denied" ? "denied" : "default";
    }
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return "unsupported";
    return Notification.permission as PushPermission;
  } catch {
    return "unsupported";
  }
}

/** Mande pèmisyon (si nesesè) epi anrejistre aparèy la. Pa gen efè si pèmisyon an refize. */
export async function enablePush(): Promise<"on" | "denied" | "off" | "error"> {
  try {
    if (isNative()) {
      const { FirebaseMessaging } = await import("@capacitor-firebase/messaging");
      const p = await FirebaseMessaging.requestPermissions();
      if (p.receive !== "granted") return p.receive === "denied" ? "denied" : "off";
      await registerNative();
      return "on";
    }
    const perm = await Notification.requestPermission();
    if (perm !== "granted") return perm === "denied" ? "denied" : "off";
    const cfg = await (await fetch("/api/push")).json();
    if (!cfg.webPublicKey) return "error";
    const reg = await navigator.serviceWorker.ready;
    const sub =
      (await reg.pushManager.getSubscription()) ||
      (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToUint8(cfg.webPublicKey) }));
    const res = await post({ kind: "web", subscription: sub.toJSON() });
    return res.ok ? "on" : "error";
  } catch {
    return "error";
  }
}
