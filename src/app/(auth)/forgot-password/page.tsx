"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/language-provider";
import { tr } from "@/lib/i18n/tr";

export default function ForgotPasswordPage() {
  const { lang } = useLanguage();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error || `Erè (kòd ${res.status}).`);
      else setSent(true);
    } catch {
      setError("Erè rezo — eseye ankò.");
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-paper px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm bg-white dark:bg-dark-surface border border-ink/10 dark:border-dark-border rounded-card p-8"
      >
        <h1 className="font-display text-2xl mb-1">
          {tr(lang, { ht: "Mo de pas bliye", fr: "Mot de passe oublié", en: "Forgot password" })}
        </h1>
        {sent ? (
          <p className="text-sm text-ink/70 dark:text-paper/70 mt-3" role="status">
            {tr(lang, {
              ht: "Si yon kont egziste ak imèl sa a, nou voye yon lyen pou chanje mo de pas la. Lyen an valab 30 minit. Verifye tou dosye spam.",
              fr: "Si un compte existe avec cet e-mail, nous avons envoyé un lien de réinitialisation, valable 30 minutes. Vérifiez aussi vos spams.",
              en: "If an account exists for this email, we've sent a reset link valid for 30 minutes. Check your spam folder too.",
            })}
          </p>
        ) : (
          <>
            <p className="text-sm text-ink/60 dark:text-paper/60 mb-6">
              {tr(lang, {
                ht: "Antre imèl kont ou an pou resevwa yon lyen.",
                fr: "Entrez l'e-mail de votre compte pour recevoir un lien.",
                en: "Enter your account email to receive a link.",
              })}
            </p>
            <label htmlFor="email" className="block text-xs font-medium text-ink/70 dark:text-paper/70 mb-1">
              {tr(lang, { ht: "Imèl", fr: "E-mail", en: "Email" })}
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-ink/15 dark:border-dark-border rounded px-3 py-2 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30"
            />
            {error && <p className="text-sm text-brick mb-4" role="alert">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-ink text-paper rounded py-2.5 text-sm font-medium disabled:opacity-60"
            >
              {tr(lang, { ht: "Voye lyen an", fr: "Envoyer le lien", en: "Send link" })}
            </button>
          </>
        )}
        <div className="text-center mt-4">
          <Link href="/login" className="text-xs text-forest underline">
            {tr(lang, { ht: "Retounen nan koneksyon", fr: "Retour à la connexion", en: "Back to login" })}
          </Link>
        </div>
      </form>
    </main>
  );
}
