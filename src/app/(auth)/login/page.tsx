"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/language-provider";
import { tr } from "@/lib/i18n/tr";

export default function LoginPage() {
  const router = useRouter();
  const { t, lang } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"password" | "mfa">("password");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Apre yon chanjman modpas obligatwa, itilizatè 2FA a vini dirèkteman nan etap kòd la.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("step") === "mfa") setStep("mfa");
  }, []);

  async function post(url: string, payload: unknown) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    return { res, data } as { res: Response; data: { error?: string; mfaRequired?: boolean; mustChangePassword?: boolean; expired?: boolean } };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (step === "mfa") {
        const { res, data } = await post("/api/auth/2fa/verify", { code });
        if (!res.ok) {
          setError(data.error || `Erè (kòd ${res.status}).`);
          if (data.expired) setStep("password");
          setLoading(false);
          return;
        }
        router.push("/dashboard");
        router.refresh();
        return;
      }

      if (!email || password.length < 6) {
        setError(t("login_error_generic"));
        setLoading(false);
        return;
      }
      const { res, data } = await post("/api/auth/login", { email, password });
      setLoading(false);
      if (!res.ok) {
        setError(data.error || `Koneksyon echwe (kòd ${res.status}).`);
        return;
      }
      if (data.mustChangePassword) return router.push("/change-password");
      if (data.mfaRequired) {
        setStep("mfa");
        setCode("");
        return;
      }
      router.push("/dashboard");
    } catch {
      setLoading(false);
      setError("Erè rezo — verifye koneksyon entènèt ou epi eseye ankò.");
    }
  }

  const inputClass =
    "w-full border border-ink/15 dark:border-dark-border rounded px-3 py-2 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30";
  const labelClass = "block text-xs font-medium text-ink/70 dark:text-paper/70 mb-1";

  return (
    <main className="min-h-screen flex items-center justify-center bg-paper px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white dark:bg-dark-surface border border-ink/10 dark:border-dark-border rounded-card p-8"
      >
        <h1 className="font-display text-2xl mb-1">{t("nav_brand_name")}</h1>
        <p className="text-sm text-ink/60 dark:text-paper/60 mb-6">
          {step === "mfa"
            ? tr(lang, {
                ht: "Antre kòd 6 chif ki nan aplikasyon otantifikasyon ou an (oswa yon kòd rekiperasyon).",
                fr: "Saisissez le code à 6 chiffres de votre application d'authentification (ou un code de secours).",
                en: "Enter the 6-digit code from your authenticator app (or a recovery code).",
              })
            : t("login_title")}
        </p>

        {step === "password" ? (
          <>
            <label htmlFor="email" className={labelClass}>{t("login_email")}</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@gadys.com"
              className={inputClass}
            />
            <label htmlFor="password" className={labelClass}>{t("login_password")}</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`${inputClass} !mb-2`}
            />
            <div className="text-right mb-3">
              <Link href="/forgot-password" className="text-xs text-forest underline">
                {tr(lang, { ht: "Mo de pas bliye?", fr: "Mot de passe oublié ?", en: "Forgot password?" })}
              </Link>
            </div>
          </>
        ) : (
          <>
            <label htmlFor="code" className={labelClass}>
              {tr(lang, { ht: "Kòd sekirite", fr: "Code de sécurité", en: "Security code" })}
            </label>
            <input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              className={`${inputClass} tracking-widest text-center`}
            />
          </>
        )}

        {error && (
          <p className="text-sm text-brick mb-4" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-ink text-paper rounded py-2.5 text-sm font-medium mt-2 disabled:opacity-60"
        >
          {loading
            ? t("login_loading")
            : step === "mfa"
              ? tr(lang, { ht: "Verifye", fr: "Vérifier", en: "Verify" })
              : t("login_button")}
        </button>
        {step === "mfa" && (
          <button
            type="button"
            onClick={() => { setStep("password"); setError(""); }}
            className="w-full text-xs text-ink/60 dark:text-paper/60 mt-3 underline"
          >
            {tr(lang, { ht: "Retounen", fr: "Retour", en: "Back" })}
          </button>
        )}
      </form>
    </main>
  );
}
