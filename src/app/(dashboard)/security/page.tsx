"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-provider";
import { tr } from "@/lib/i18n/tr";

type Status = { enabled: boolean; recoveryLeft: number };

export default function SecurityPage() {
  const { lang } = useLanguage();
  const [status, setStatus] = useState<Status | null>(null);
  const [setup, setSetup] = useState<{ secret: string; qr: string } | null>(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [recovery, setRecovery] = useState<string[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/auth/2fa");
    if (res.ok) setStatus(await res.json());
  }
  useEffect(() => { load(); }, []);

  async function call(payload: Record<string, unknown>) {
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || `Erè (kòd ${res.status}).`); return null; }
      return data;
    } catch {
      setError("Erè rezo — eseye ankò.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function startSetup() {
    const d = await call({ action: "setup" });
    if (d) setSetup({ secret: d.secret, qr: d.qr });
  }
  async function enable() {
    const d = await call({ action: "enable", code });
    if (d) { setRecovery(d.recoveryCodes); setSetup(null); setCode(""); load(); }
  }
  async function disable() {
    const d = await call({ action: "disable", password, code });
    if (d) { setPassword(""); setCode(""); load(); }
  }

  const input = "w-full border border-ink/15 dark:border-dark-border rounded px-3 py-2 mb-3 text-sm bg-white dark:bg-dark-surface focus:outline-none focus:ring-2 focus:ring-forest/30";
  const btn = "bg-ink text-paper rounded px-4 py-2 text-sm font-medium disabled:opacity-60";

  return (
    <div className="max-w-lg mx-auto p-4 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-forest/10 text-forest flex items-center justify-center"><ShieldCheck size={20} /></div>
        <div>
          <h1 className="font-display text-2xl leading-tight">
            {tr(lang, { ht: "Sekirite kont", fr: "Sécurité du compte", en: "Account security" })}
          </h1>
          <p className="text-sm text-ink/60 dark:text-paper/60">
            {tr(lang, { ht: "Otantifikasyon an 2 etap (2FA)", fr: "Authentification à 2 facteurs (2FA)", en: "Two-factor authentication (2FA)" })}
          </p>
        </div>
      </div>

      {recovery && (
        <section className="border border-forest/30 bg-forest/5 rounded-card p-5 mb-6" role="status">
          <h2 className="font-semibold mb-1">
            {tr(lang, { ht: "Kenbe kòd rekiperasyon sa yo", fr: "Conservez ces codes de secours", en: "Save these recovery codes" })}
          </h2>
          <p className="text-sm mb-3">
            {tr(lang, {
              ht: "Yo parèt yon sèl fwa. Chak kòd sèvi yon sèl fwa si w pèdi telefòn ou.",
              fr: "Ils ne s'affichent qu'une fois. Chaque code est à usage unique si vous perdez votre téléphone.",
              en: "Shown only once. Each code works once if you lose your phone.",
            })}
          </p>
          <ul className="grid grid-cols-2 gap-2 font-mono text-sm mb-3">
            {recovery.map((c) => <li key={c}>{c}</li>)}
          </ul>
          <button className={btn} onClick={() => navigator.clipboard?.writeText(recovery.join("\n"))}>
            {tr(lang, { ht: "Kopye", fr: "Copier", en: "Copy" })}
          </button>
          <button className="ml-2 text-sm underline" onClick={() => setRecovery(null)}>
            {tr(lang, { ht: "Mwen sove yo", fr: "Je les ai enregistrés", en: "I've saved them" })}
          </button>
        </section>
      )}

      <section className="border border-ink/10 dark:border-dark-border rounded-card p-5 bg-white dark:bg-dark-surface">
        {!status ? (
          <p className="text-sm">…</p>
        ) : status.enabled ? (
          <>
            <p className="text-sm mb-1">
              ✅ {tr(lang, { ht: "2FA aktif.", fr: "2FA activée.", en: "2FA is on." })}{" "}
              {tr(lang, { ht: `${status.recoveryLeft} kòd rekiperasyon rete.`, fr: `${status.recoveryLeft} code(s) de secours restant(s).`, en: `${status.recoveryLeft} recovery code(s) left.` })}
            </p>
            <p className="text-xs text-ink/60 dark:text-paper/60 mb-4">
              {tr(lang, { ht: "Pou dezaktive l, antre mo de pas ou ak yon kòd.", fr: "Pour la désactiver, saisissez votre mot de passe et un code.", en: "To turn it off, enter your password and a code." })}
            </p>
            <input type="password" autoComplete="current-password" placeholder={tr(lang, { ht: "Mo de pas", fr: "Mot de passe", en: "Password" })} value={password} onChange={(e) => setPassword(e.target.value)} className={input} />
            <input inputMode="numeric" autoComplete="one-time-code" placeholder="123456" value={code} onChange={(e) => setCode(e.target.value)} className={input} />
            <button className={btn} disabled={busy || !password || !code} onClick={disable}>
              {tr(lang, { ht: "Dezaktive 2FA", fr: "Désactiver la 2FA", en: "Turn off 2FA" })}
            </button>
          </>
        ) : setup ? (
          <>
            <p className="text-sm mb-3">
              {tr(lang, {
                ht: "1) Eskane kòd QR la ak Google Authenticator, Microsoft Authenticator, Authy oswa 1Password. 2) Antre kòd 6 chif la.",
                fr: "1) Scannez le QR code avec Google Authenticator, Microsoft Authenticator, Authy ou 1Password. 2) Saisissez le code à 6 chiffres.",
                en: "1) Scan the QR code with Google Authenticator, Microsoft Authenticator, Authy or 1Password. 2) Enter the 6-digit code.",
              })}
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={setup.qr} alt="QR 2FA" width={220} height={220} className="mx-auto mb-2 bg-white p-1 rounded" />
            <p className="text-xs text-center break-all mb-4 font-mono">{setup.secret}</p>
            <input inputMode="numeric" autoComplete="one-time-code" placeholder="123456" value={code} onChange={(e) => setCode(e.target.value)} className={input} />
            <button className={btn} disabled={busy || code.length < 6} onClick={enable}>
              {tr(lang, { ht: "Aktive", fr: "Activer", en: "Enable" })}
            </button>
          </>
        ) : (
          <>
            <p className="text-sm mb-4">
              {tr(lang, {
                ht: "Ajoute yon dezyèm etap nan koneksyon an: yon kòd ki chanje chak 30 segonn sou telefòn ou. Rekòmande pou tout administratè.",
                fr: "Ajoutez une seconde étape à la connexion : un code qui change toutes les 30 secondes sur votre téléphone. Recommandé pour tous les administrateurs.",
                en: "Add a second login step: a code that changes every 30 seconds on your phone. Recommended for all admins.",
              })}
            </p>
            <button className={btn} disabled={busy} onClick={startSetup}>
              {tr(lang, { ht: "Konfigire 2FA", fr: "Configurer la 2FA", en: "Set up 2FA" })}
            </button>
          </>
        )}
        {error && <p className="text-sm text-brick mt-3" role="alert">{error}</p>}
      </section>
    </div>
  );
}
