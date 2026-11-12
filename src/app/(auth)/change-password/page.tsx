"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-provider";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [expired, setExpired] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError(t("cp_mismatch"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Erè — eseye ankò.");
        setExpired(!!data.expired);
        setLoading(false);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Erè rezo — verifye koneksyon entènèt ou epi eseye ankò.");
      setLoading(false);
    }
  }

  const inputClass =
    "w-full border border-ink/15 dark:border-dark-border rounded-xl px-3.5 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-forest/30 bg-white dark:bg-dark-surface";
  const labelClass =
    "block text-[11px] font-bold tracking-[0.12em] uppercase text-ink/60 dark:text-paper/60 mb-1.5";

  return (
    <main className="min-h-screen flex items-center justify-center bg-paper px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white dark:bg-dark-surface border border-ink/10 dark:border-dark-border rounded-card p-8"
      >
        <div className="w-11 h-11 rounded-full bg-forest/10 text-forest flex items-center justify-center mb-4">
          <KeyRound size={20} />
        </div>
        <h1 className="font-display text-2xl mb-1">{t("cp_title")}</h1>
        <p className="text-sm text-ink/60 dark:text-paper/60 mb-6">{t("cp_subtitle")}</p>

        <label className={labelClass}>{t("cp_new")}</label>
        <div className="relative mb-4">
          <input
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${inputClass} pr-11`}
            autoComplete="new-password"
            minLength={8}
            required
            autoFocus
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label="Montre/kache"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40"
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <label className={labelClass}>{t("cp_confirm")}</label>
        <input
          type={show ? "text" : "password"}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={`${inputClass} mb-2`}
          autoComplete="new-password"
          required
        />
        <p className="text-xs text-ink/50 dark:text-paper/50 mb-4">{t("cp_rules")}</p>

        {error && (
          <p className="text-sm text-brick mb-4" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-ink text-paper rounded-xl py-3 text-sm font-semibold disabled:opacity-60"
        >
          {loading ? "..." : t("cp_submit")}
        </button>

        {expired && (
          <Link href="/login" className="block text-center text-sm text-forest underline underline-offset-2 mt-4">
            {t("cp_back_login")}
          </Link>
        )}
      </form>
    </main>
  );
}
