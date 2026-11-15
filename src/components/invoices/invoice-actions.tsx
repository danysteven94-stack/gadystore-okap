"use client";

import { useState } from "react";
import { Download, Loader2, MessageCircle, FileText, Share2 } from "lucide-react";

type Cap = {
  isNativePlatform?: () => boolean;
  Plugins?: {
    Browser?: { open: (o: { url: string }) => Promise<void> };
    Share?: { share: (o: { title?: string; url?: string; dialogTitle?: string }) => Promise<void> };
  };
};
const cap = (): Cap | undefined => (typeof window !== "undefined" ? (window as unknown as { Capacitor?: Cap }).Capacitor : undefined);
const isNative = () => !!cap()?.isNativePlatform?.();

/** Louvri yon PDF: nan app natif la → navigatè entèn (Safari/Chrome) kote ou ka sove l / pataje l; sou entènèt → nouvo onglè. */
async function openPdf(url: string) {
  const browser = cap()?.Plugins?.Browser;
  if (isNative() && browser) return browser.open({ url });
  const w = window.open(url, "_blank", "noopener");
  if (!w) window.location.href = url;
}

/** Telechaje PDF la: sou entènèt → fichye ki desann dirèkteman; nan app natif la → navigatè entèn ak bouton pataje/sove. */
async function downloadPdf(url: string, filename: string) {
  if (isNative()) return openPdf(url);
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error();
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  } catch {
    await openPdf(url);
  }
}

interface Props {
  kind: "sale" | "order";
  id: string;
  phone?: string; // nimewo kliyan an (si genyen), ka chanje pou voye bay nenpòt moun
}

export function InvoiceActions({ kind, id, phone }: Props) {
  const [busy, setBusy] = useState<"" | "dl" | "wa" | "view" | "share">("");
  const [open, setOpen] = useState(false);
  const [number, setNumber] = useState(phone ?? "");
  const [err, setErr] = useState("");

  async function link(withPhone?: string) {
    const res = await fetch("/api/invoices/link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, id, phone: withPhone }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? "Pa ka jenere fakti a.");
    return data as { pdfUrl: string; downloadUrl: string; whatsappUrl: string };
  }

  async function run(kindBusy: "dl" | "wa" | "view" | "share") {
    setBusy(kindBusy);
    setErr("");
    try {
      if (kindBusy === "wa") {
        const d = await link(number);
        await openPdf(d.whatsappUrl);
        setOpen(false);
      } else if (kindBusy === "dl") {
        const d = await link();
        await downloadPdf(d.downloadUrl, `fakti-${id.slice(0, 8)}.pdf`);
      } else if (kindBusy === "share") {
        const d = await link();
        const share = cap()?.Plugins?.Share;
        if (isNative() && share) await share.share({ title: "Fakti", url: d.pdfUrl, dialogTitle: "Pataje fakti a" });
        else if (navigator.share) await navigator.share({ title: "Fakti", url: d.pdfUrl });
        else await openPdf(d.pdfUrl);
      } else {
        const d = await link();
        await openPdf(d.pdfUrl);
      }
    } catch (e) {
      // Itilizatè a anile fenèt pataje a: pa afiche erè
      if (!(e instanceof Error && e.name === "AbortError")) setErr(e instanceof Error ? e.message : "Erè.");
    }
    setBusy("");
  }

  const btn = "inline-flex items-center gap-1.5 text-xs font-medium underline underline-offset-2 disabled:opacity-50";

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-4">
        <button type="button" onClick={() => run("view")} disabled={!!busy} className={`${btn} text-forest`}>
          {busy === "view" ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />} Fakti
        </button>
        <button type="button" onClick={() => run("dl")} disabled={!!busy} className={`${btn} text-forest`}>
          {busy === "dl" ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} Telechaje PDF
        </button>
        <button type="button" onClick={() => setOpen((v) => !v)} className={`${btn} text-forest`}>
          <MessageCircle size={13} /> Voye sou WhatsApp
        </button>
        <button type="button" onClick={() => run("share")} disabled={!!busy} className={`${btn} text-forest`}>
          {busy === "share" ? <Loader2 size={13} className="animate-spin" /> : <Share2 size={13} />} Pataje
        </button>
      </div>

      {open && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            type="tel"
            inputMode="tel"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="Nimewo (ekz: 37123456) — kite vid pou chwazi kontak"
            className="flex-1 min-w-[200px] border border-ink/15 dark:border-dark-border rounded-md px-3 py-1.5 text-xs bg-white dark:bg-dark-surface"
          />
          <button
            type="button"
            onClick={() => run("wa")}
            disabled={!!busy}
            className="bg-forest text-white rounded-md px-3 py-1.5 text-xs font-medium disabled:opacity-50"
          >
            {busy === "wa" ? "..." : "Voye"}
          </button>
        </div>
      )}
      {err && <p className="mt-1 text-xs text-brick">{err}</p>}
    </div>
  );
}
