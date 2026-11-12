"use client";

import { useState } from "react";

const SUPPORT = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "danystevenj@gmail.com";

export default function AccountDeletionPage() {
  const [password, setPassword] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!confirm("Ou sèten ou vle efase kont ou? Aksyon sa a pa ka defèt.")) return;
    setState("loading");
    const res = await fetch("/api/auth/delete-account", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) { setState("done"); setTimeout(() => (window.location.href = "/login"), 2500); }
    else { setState("error"); setMsg(data.error || "Erè. Eseye ankò."); }
  }

  return (
    <main className="max-w-xl mx-auto px-5 py-10 pt-[calc(2.5rem+env(safe-area-inset-top))]">
      <h1 className="text-2xl font-semibold mb-4">Efase kont mwen / Delete my account</h1>
      <p className="text-sm mb-6 opacity-80">
        Si ou konekte, antre modpas ou pou efase kont ou imedyatman. Si ou pa ka konekte,
        voye yon imèl bay <a className="underline" href={`mailto:${SUPPORT}?subject=Delete%20account`}>{SUPPORT}</a>{" "}
        depi adrès imèl kont lan — n ap efase l nan 30 jou.
        <br /><br />
        If you are signed in, enter your password below to delete your account immediately.
        Otherwise email us from the account&apos;s address and we will delete it within 30 days.
      </p>
      <p className="text-sm mb-6 opacity-80">
        Sa ki efase: imèl, non, modpas ak aksè ou. Done biznis (vant, faktiti) ki lye ak antrepriz la
        efase sou demann nan imèl la.
      </p>
      {state === "done" ? (
        <p className="text-sm font-medium">Kont ou efase. Ap redirije…</p>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <input
            type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Modpas / Password" required
            className="w-full border border-ink/15 dark:border-dark-border rounded px-3 py-2 text-sm"
          />
          {state === "error" && <p className="text-sm text-brick">{msg}</p>}
          <button
            disabled={state === "loading"}
            className="bg-brick text-white rounded px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {state === "loading" ? "…" : "Efase kont mwen"}
          </button>
        </form>
      )}
    </main>
  );
}
