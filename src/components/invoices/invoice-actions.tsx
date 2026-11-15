"use client";

import { useState } from "react";
import { Download, Loader2, MessageCircle, FileText } from "lucide-react";

interface Props {
  kind: "sale" | "order";
  id: string;
  phone?: string; // nimewo kliyan an (si genyen), ka chanje pou voye bay nenpòt moun
}

export function InvoiceActions({ kind, id, phone }: Props) {
  const [busy, setBusy] = useState<"" | "dl" | "wa" | "view">("");
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

  async function run(kindBusy: "dl" | "wa" | "view") {
    setBusy(kindBusy);
    setErr("");
    try {
      if (kindBusy === "wa") {
        const d = await link(number);
        window.open(d.whatsappUrl, "_blank", "noopener");
        setOpen(false);
      } else {
        const d = await link();
        window.open(kindBusy === "dl" ? d.downloadUrl : d.pdfUrl, "_blank", "noopener");
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erè.");
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
