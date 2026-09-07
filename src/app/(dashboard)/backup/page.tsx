"use client";

import { useEffect, useState, useCallback } from "react";
import { DatabaseBackup, Loader2, RotateCcw, ShieldCheck } from "lucide-react";
import { BusinessSwitcher } from "@/components/dashboard/business-switcher";
import { useLanguage } from "@/lib/i18n/language-provider";
import type { Business } from "@/types";

export default function BackupPage() {
  const { t } = useLanguage();
  const [businesses, setBusinesses] = useState<Business[] | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [backups, setBackups] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/businesses")
      .then((res) => res.json())
      .then((data) => {
        setBusinesses(data.businesses ?? []);
      })
      .catch(() => setBusinesses([]));
  }, []);

  const load = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/backup?businessId=${businessId}`);
      const data = await res.json();
      setBackups(data.backups ?? []);
    } catch {
      setBackups([]);
    }
    setLoading(false);
  }, [businessId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleBackupNow() {
    if (!businessId) return;
    setWorking(true);
    setStatus(null);
    try {
      const res = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      });
      if (!res.ok) throw new Error();
      setStatus(t("backup_success"));
      await load();
    } catch {
      setStatus(t("backup_error"));
    }
    setWorking(false);
  }

  async function handleRestore(backupId: string) {
    if (!confirm(`Restore sovgad "${backupId}"? Sa ap ekrase done aktyèl yo.`)) return;
    setWorking(true);
    setStatus(null);
    try {
      const res = await fetch("/api/backup/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backupId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error || t("backup_error"));
      } else {
        setStatus(t("backup_restore_success"));
      }
    } catch {
      setStatus("Erè rezo — eseye ankò.");
    }
    setWorking(false);
  }

  if (businesses === null) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 flex flex-col items-center text-ink/40 dark:text-paper/40">
        <Loader2 size={24} className="animate-spin mb-2" />
        <p className="text-sm">Ap chaje...</p>
      </main>
    );
  }

  if (businesses.length === 0) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 text-center">
        <DatabaseBackup size={28} className="mx-auto mb-3 text-ink/30" />
        <p className="text-sm text-ink/60 dark:text-paper/60">
          {t("backup_need_business")}
        </p>
      </main>
    );
  }

  if (!businessId) {
    return (
      <main className="max-w-3xl mx-auto px-4 lg:px-8 py-8">
        <BusinessSwitcher
          businesses={businesses.map((b) => ({ id: b.id, name: b.name, icon: b.icon }))}
          activeId=""
          onSelect={setBusinessId}
          showOverviewTab={false}
        />
        <p className="text-sm text-center text-ink/40 dark:text-paper/40 py-10">
          {t("choose_business_prompt")}
        </p>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 lg:px-8 py-8 pb-24">
      <h1 className="font-display text-xl lg:text-2xl mb-4">{t("backup_title")}</h1>

      <BusinessSwitcher
        businesses={businesses.map((b) => ({ id: b.id, name: b.name, icon: b.icon }))}
        activeId={businessId ?? ""}
        onSelect={setBusinessId}
        showOverviewTab={false}
      />

      <div className="rounded-card border border-ink/10 dark:border-dark-border bg-white dark:bg-dark-surface p-5 my-5 text-center">
        <ShieldCheck size={28} className="mx-auto mb-2 text-forest" />
        <p className="text-sm text-ink/60 dark:text-paper/60 mb-4">
          {t("backup_description")}
        </p>
        <button
          onClick={handleBackupNow}
          disabled={working}
          className="inline-flex items-center gap-2 bg-forest text-paper rounded-full px-5 py-2.5 text-sm font-medium disabled:opacity-50"
        >
          {working ? t("backup_working") : t("backup_now")}
        </button>
        {status && <p className="text-xs text-ink/50 dark:text-paper/50 mt-3">{status}</p>}
      </div>

      <h2 className="font-display text-base mb-2">{t("backup_history")}</h2>
      {loading ? (
        <div className="flex justify-center py-10 text-ink/40 dark:text-paper/40">
          <Loader2 size={20} className="animate-spin" />
        </div>
      ) : backups.length === 0 ? (
        <p className="text-sm text-center text-ink/40 dark:text-paper/40 py-10">
          {t("backup_empty")}
        </p>
      ) : (
        <div className="rounded-card border border-ink/10 dark:border-dark-border bg-white dark:bg-dark-surface overflow-hidden">
          {backups.map((id, i) => (
            <div
              key={id}
              className={`flex items-center justify-between px-4 py-3 text-sm ${
                i > 0 ? "border-t border-ink/8 dark:border-dark-border/60" : ""
              }`}
            >
              <span className="stat-figure text-ink/70 dark:text-paper/70">{id}</span>
              <button
                onClick={() => handleRestore(id)}
                disabled={working}
                className="flex items-center gap-1 text-xs font-medium text-forest disabled:opacity-50"
              >
                <RotateCcw size={13} /> {t("backup_restore")}
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
