"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  AlertTriangle,
  UserPlus,
  Coins,
  PackagePlus,
  Undo2,
  Receipt,
  WalletCards,
  CheckCheck,
  Loader2,
} from "lucide-react";
import { DashShell } from "@/components/dashboard/dash-shell";
import { useLanguage } from "@/lib/i18n/language-provider";
import { NOTIFICATIONS_CHANGED } from "@/lib/use-unread-notifications";
import type { TranslationKey } from "@/lib/i18n/dictionary";

interface NotifItem {
  id: string;
  businessId: string;
  businessName: string;
  type: string;
  title?: string;
  url?: string;
  message: string;
  read: boolean;
  createdAt: string;
}

const TYPE_META: Record<string, { icon: React.ElementType; label: TranslationKey }> = {
  low_stock: { icon: AlertTriangle, label: "notif_type_low_stock" },
  new_customer: { icon: UserPlus, label: "notif_type_new_customer" },
  new_sale: { icon: Coins, label: "notif_type_new_sale" },
  new_purchase: { icon: PackagePlus, label: "notif_type_new_purchase" },
  product_return: { icon: Undo2, label: "notif_type_product_return" },
  large_expense: { icon: Receipt, label: "notif_type_large_expense" },
  billing: { icon: WalletCards, label: "notif_type_billing" },
};

/** Kote pou ale lè moun nan klike sou notifikasyon an. */
function targetUrl(n: NotifItem): string {
  if (n.url) return n.url;
  switch (n.type) {
    case "low_stock": return "/products";
    case "large_expense": return "/expenses";
    case "product_return": return "/returns";
    case "new_customer": return "/contacts?kind=customer";
    case "new_sale": return n.message.startsWith("Nouvo kòmand") ? "/orders" : "/dashboard";
    default: return "/dashboard";
  }
}

export default function NotificationsPage() {
  return (
    <DashShell>
      <NotificationsInner />
    </DashShell>
  );
}

function NotificationsInner() {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const [items, setItems] = useState<NotifItem[] | null>(null);
  const [tab, setTab] = useState<"unread" | "all">("unread");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  const locale = lang === "en" ? "en" : "fr";
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  function ago(iso: string) {
    const d = new Date(iso).getTime();
    if (isNaN(d)) return "";
    const s = Math.round((d - Date.now()) / 1000);
    const abs = Math.abs(s);
    if (abs < 60) return rtf.format(0, "second");
    if (abs < 3600) return rtf.format(Math.round(s / 60), "minute");
    if (abs < 86400) return rtf.format(Math.round(s / 3600), "hour");
    if (abs < 86400 * 30) return rtf.format(Math.round(s / 86400), "day");
    return new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
  }

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setItems(data.notifications ?? []);
      setError(false);
    } catch {
      setError(true);
      setItems((prev) => prev ?? []);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const unread = (items ?? []).filter((n) => !n.read);
  const shown = tab === "unread" ? unread : items ?? [];

  async function markRead(n: NotifItem) {
    if (n.read) return;
    setItems((prev) => (prev ?? []).map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: n.id }),
      });
    } catch {
      /* silans */
    }
    window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED));
  }

  async function open(n: NotifItem) {
    await markRead(n);
    router.push(targetUrl(n));
  }

  async function markAll() {
    setBusy(true);
    setItems((prev) => (prev ?? []).map((x) => ({ ...x, read: true })));
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
    } catch {
      /* silans */
    }
    window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED));
    setBusy(false);
  }

  const tabClass = (active: boolean) =>
    `flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      active
        ? "bg-ink text-white dark:bg-white dark:text-ink"
        : "text-ink/60 dark:text-white/60 hover:bg-mist dark:hover:bg-white/10"
    }`;

  return (
    <main className="max-w-3xl mx-auto px-4 py-5">
      <div className="flex items-center justify-between mb-4 gap-3">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Bell size={20} /> {t("notif_title")}
        </h1>
        {unread.length > 0 && (
          <button
            onClick={markAll}
            disabled={busy}
            className="inline-flex items-center gap-1.5 text-xs font-medium rounded-lg border border-line dark:border-dark-border px-3 py-2 hover:border-ink dark:hover:border-white disabled:opacity-50"
          >
            <CheckCheck size={14} /> {t("notif_mark_all")}
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-4 p-1 rounded-xl border border-line dark:border-dark-border bg-white dark:bg-dark-surface">
        <button onClick={() => setTab("unread")} className={tabClass(tab === "unread")}>
          {t("notif_unread")}
          {unread.length > 0 && (
            <span className="ml-1.5 inline-flex min-w-5 h-5 px-1.5 items-center justify-center rounded-full bg-brick text-white text-[11px] font-bold">
              {unread.length}
            </span>
          )}
        </button>
        <button onClick={() => setTab("all")} className={tabClass(tab === "all")}>
          {t("notif_all")}
        </button>
      </div>

      {error && <p className="text-sm text-brick mb-3">{t("notif_error")}</p>}

      {items === null ? (
        <div className="flex flex-col items-center py-12 text-ink/40 dark:text-white/40">
          <Loader2 size={22} className="animate-spin mb-2" />
          <p className="text-sm">{t("notif_loading")}</p>
        </div>
      ) : shown.length === 0 ? (
        <p className="text-sm text-ink/50 dark:text-white/50 text-center py-12">
          {tab === "unread" ? t("notif_empty_unread") : t("notif_empty_all")}
        </p>
      ) : (
        <div className="rounded-card border border-line dark:border-dark-border overflow-hidden bg-white dark:bg-dark-surface">
          {shown.map((n, i) => {
            const meta = TYPE_META[n.type] ?? { icon: Bell, label: "notif_title" as TranslationKey };
            const Icon = meta.icon;
            return (
              <button
                key={n.id}
                onClick={() => open(n)}
                className={`w-full text-left flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-mist/60 dark:hover:bg-white/5 ${
                  i > 0 ? "border-t border-line dark:border-dark-border/60" : ""
                } ${n.read ? "" : "bg-brick/5"}`}
              >
                <span
                  className={`mt-0.5 w-9 h-9 shrink-0 rounded-full flex items-center justify-center ${
                    n.read ? "bg-mist text-ink/60 dark:bg-white/10 dark:text-white/60" : "bg-brick text-white"
                  }`}
                >
                  <Icon size={16} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="flex items-center justify-between gap-2">
                    <span className={`text-sm truncate ${n.read ? "font-medium" : "font-semibold"}`}>
                      {n.title || t(meta.label)}
                    </span>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-brick shrink-0" aria-hidden />}
                  </span>
                  <span className="block text-sm text-ink/70 dark:text-white/70 mt-0.5 break-words">{n.message}</span>
                  <span className="block text-xs text-ink/40 dark:text-white/40 mt-1">
                    {n.businessName ? `${n.businessName} · ` : ""}
                    {ago(n.createdAt)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </main>
  );
}
