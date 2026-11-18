"use client";
import { useEffect } from "react";
import { reportClientError } from "@/components/ui/error-view";

// Dènye filè sekou: kouvri erè nan layout rasin nan. Dwe gen pwòp <html>/<body>.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    reportClientError(error, "global");
  }, [error]);

  return (
    <html lang="fr">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#fff", color: "#111" }}>
        <main role="alert" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 24 }}>
          <div style={{ maxWidth: 360 }}>
            <div style={{ width: 40, height: 4, background: "#C8102E", margin: "0 auto 20px" }} />
            <h1 style={{ fontSize: 24, margin: "0 0 8px" }}>Gen yon bagay ki pa mache · Une erreur est survenue</h1>
            <p style={{ fontSize: 14, opacity: 0.7, margin: "0 0 24px" }}>
              Done w yo an sekirite. / Vos données sont en sécurité.
            </p>
            <button
              onClick={reset}
              style={{ background: "#C8102E", color: "#fff", border: 0, borderRadius: 8, padding: "10px 16px", fontSize: 14, cursor: "pointer" }}
            >
              Eseye ankò / Réessayer
            </button>
            {error.digest && <p style={{ marginTop: 24, fontSize: 12, opacity: 0.5 }}>Ref: <code>{error.digest}</code></p>}
          </div>
        </main>
      </body>
    </html>
  );
}
