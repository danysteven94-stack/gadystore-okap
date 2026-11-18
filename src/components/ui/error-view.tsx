"use client";

import { useEffect, useState } from "react";

type Lang = "ht" | "fr" | "en";

// Tèks yo la dirèkteman (pa nan dictionary/provider), paske ErrorView ka afiche
// menm lè LanguageProvider la tèt li kraze.
const TEXT: Record<Lang, { title: string; body: string; retry: string; home: string; ref: string }> = {
  ht: {
    title: "Gen yon bagay ki pa mache",
    body: "Paj la pa t kapab chaje. Done w yo an sekirite. Eseye ankò; si pwoblèm nan rete, voye nou referans lan.",
    retry: "Eseye ankò",
    home: "Retounen lakay",
    ref: "Referans",
  },
  fr: {
    title: "Une erreur est survenue",
    body: "La page n'a pas pu se charger. Vos données sont en sécurité. Réessayez ; si le problème persiste, communiquez-nous la référence.",
    retry: "Réessayer",
    home: "Retour à l'accueil",
    ref: "Référence",
  },
  en: {
    title: "Something went wrong",
    body: "The page couldn't load. Your data is safe. Try again; if it keeps happening, send us the reference.",
    retry: "Try again",
    home: "Back to home",
    ref: "Reference",
  },
};

function readLang(): Lang {
  try {
    const saved = window.localStorage.getItem("gadys-lang");
    if (saved === "ht" || saved === "fr" || saved === "en") return saved;
  } catch {}
  const nav = (navigator.language || "").slice(0, 2);
  return nav === "fr" ? "fr" : nav === "en" ? "en" : "ht";
}

/** Voye erè a bay sèvè a (sendBeacon, pa janm bloke UI a). */
export function reportClientError(error: Error & { digest?: string }, scope: string) {
  try {
    const body = JSON.stringify({
      scope,
      message: String(error?.message ?? "").slice(0, 500),
      stack: String(error?.stack ?? "").slice(0, 2000),
      digest: error?.digest,
      path: window.location.pathname,
      ua: navigator.userAgent.slice(0, 200),
    });
    const blob = new Blob([body], { type: "application/json" });
    if (!navigator.sendBeacon?.("/api/client-error", blob)) {
      fetch("/api/client-error", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } }).catch(() => {});
    }
  } catch {}
}

export function ErrorView({
  error,
  reset,
  scope,
  homeHref = "/",
}: {
  error: Error & { digest?: string };
  reset: () => void;
  scope: string;
  homeHref?: string;
}) {
  const [lang, setLang] = useState<Lang>("ht");

  useEffect(() => {
    setLang(readLang());
    reportClientError(error, scope);
  }, [error, scope]);

  const t = TEXT[lang];

  return (
    <main
      role="alert"
      className="min-h-[70vh] flex items-center justify-center px-6 text-center bg-white text-[#111] dark:bg-[#0B0C0E] dark:text-white"
    >
      <div className="max-w-sm">
        <div className="mx-auto mb-5 h-1 w-10 bg-[#C8102E]" />
        <h1 className="text-2xl font-semibold mb-2">{t.title}</h1>
        <p className="text-sm opacity-70 mb-6">{t.body}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="rounded-lg bg-[#C8102E] px-4 py-2 text-sm font-medium text-white hover:bg-[#9E0C24] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8102E]"
          >
            {t.retry}
          </button>
          <a
            href={homeHref}
            className="rounded-lg border border-black/15 dark:border-white/20 px-4 py-2 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8102E]"
          >
            {t.home}
          </a>
        </div>
        {error.digest && (
          <p className="mt-6 text-xs opacity-50">
            {t.ref}: <code>{error.digest}</code>
          </p>
        )}
      </div>
    </main>
  );
}
