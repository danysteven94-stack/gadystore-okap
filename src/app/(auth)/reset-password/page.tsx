"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/language-provider";
import { tr } from "@/lib/i18n/tr";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [expired, setExpired] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Token an soti nan URL la imedyatman, pou l pa rete nan istwa/referrer.
    const t = new URLSearchParams(window.location.search).get("token") ?? "";
    setToken(t);
    if (t) window.history.replaceState(null, "", "/reset-password");
    else setExpired(true);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError(tr(lang, { ht: "Mo de pas yo pa menm.", fr: "Les mots de passe ne correspondent pas.", en: "Passwords don't match." }));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || `Erè (kòd ${res.status}).`);
        setExpired(!!data.expired);
      } else {
        setDone(true);
        setTimeout(() => router.push("/login"), 2500);
      }
    } catch {
      setError("Erè rezo — eseye ankò.");
    }
    setLoading(false);
  }

  const inputClass =
    "w-full border border-ink/15 dark:border-dark-border rounded px-3 py-2 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30";

  return (
    <main className="min-h-screen flex items-center justify-center bg-paper px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm bg-white dark:bg-dark-surface border border-ink/10 dark:border-dark-border rounded-card p-8"
      >
        <h1 className="font-display text-2xl mb-4">
          {tr(lang, { ht: "Nouvo mo de pas", fr: "Nouveau mot de passe", en: "New password" })}
        </h1>
        {done ? (
          <p className="text-sm" role="status">
            {tr(lang, {
              ht: "Mo de pas la chanje. Ou ap redirije nan koneksyon...",
              fr: "Mot de passe modifié. Redirection vers la connexion...",
              en: "Password updated. Redirecting to login...",
            })}
          </p>
        ) : (
          <>
            {!expired && (
              <>
                <label htmlFor="pw" className="block text-xs font-medium mb-1">
                  {tr(lang, { ht: "Nouvo mo de pas (8+ karaktè, lèt + chif)", fr: "Nouveau mot de passe (8+ car., lettre + chiffre)", en: "New password (8+ chars, letter + digit)" })}
                </label>
                <input id="pw" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
                <label htmlFor="pw2" className="block text-xs font-medium mb-1">
                  {tr(lang, { ht: "Konfime", fr: "Confirmer", en: "Confirm" })}
                </label>
                <input id="pw2" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass} />
              </>
            )}
            {error && <p className="text-sm text-brick mb-4" role="alert">{error}</p>}
            {expired && !error && (
              <p className="text-sm text-brick mb-4" role="alert">
                {tr(lang, { ht: "Lyen an pa valid oswa li ekspire.", fr: "Lien invalide ou expiré.", en: "Invalid or expired link." })}
              </p>
            )}
            {expired ? (
              <Link href="/forgot-password" className="block w-full text-center bg-ink text-paper rounded py-2.5 text-sm font-medium">
                {tr(lang, { ht: "Mande yon lòt lyen", fr: "Demander un nouveau lien", en: "Request a new link" })}
              </Link>
            ) : (
              <button type="submit" disabled={loading} className="w-full bg-ink text-paper rounded py-2.5 text-sm font-medium disabled:opacity-60">
                {tr(lang, { ht: "Chanje mo de pas", fr: "Changer le mot de passe", en: "Change password" })}
              </button>
            )}
          </>
        )}
      </form>
    </main>
  );
}
