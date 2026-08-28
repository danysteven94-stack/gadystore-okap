"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email || password.length < 6) {
      setError("Antre yon imèl valid ak yon mo de pas (6 karaktè minimòm).");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Koneksyon echwe.");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-paper px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white dark:bg-dark-surface border border-ink/10 dark:border-dark-border rounded-card p-8"
      >
        <h1 className="font-display text-2xl mb-1">Gady's</h1>
        <p className="text-sm text-ink/60 dark:text-paper/60 mb-6">
          Konekte pou jere antrepriz ou yo.
        </p>

        <label className="block text-xs font-medium text-ink/70 dark:text-paper/70 mb-1">
          Imèl
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@gadys.com"
          className="w-full border border-ink/15 dark:border-dark-border rounded px-3 py-2 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30"
        />

        <label className="block text-xs font-medium text-ink/70 dark:text-paper/70 mb-1">
          Mo de pas
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full border border-ink/15 dark:border-dark-border rounded px-3 py-2 mb-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30"
        />

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
          {loading ? "Ap konekte..." : "Konekte"}
        </button>
      </form>
    </main>
  );
}
