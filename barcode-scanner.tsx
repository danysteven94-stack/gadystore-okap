"use client";

import { useEffect, useRef, useState } from "react";
import { ScanLine, X } from "lucide-react";

interface Props {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

/**
 * Sèvi ak kamera aparèy la pou li kòd-baf an tan reyèl.
 * Chaje `html5-qrcode` de manyè dinamik paske li itilize `window`/`navigator`.
 */
export function BarcodeScanner({ onScan, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let scanner: import("html5-qrcode").Html5Qrcode | null = null;
    let cancelled = false;

    (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled || !containerRef.current) return;

        scanner = new Html5Qrcode(containerRef.current.id);
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (decodedText) => {
            onScan(decodedText);
            scanner?.stop().catch(() => {});
          },
          () => {
            /* ignore les échecs de lecture frame par frame */
          }
        );
      } catch {
        setError("Pa ka louvri kamera a. Verifye pèmisyon aparèy la.");
      }
    })();

    return () => {
      cancelled = true;
      scanner?.stop().catch(() => {});
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white dark:bg-dark-surface rounded-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-ink/10 dark:border-dark-border">
          <p className="text-sm font-medium flex items-center gap-2">
            <ScanLine size={16} /> Eskane kòd-baf
          </p>
          <button onClick={onClose} aria-label="Fèmen">
            <X size={18} />
          </button>
        </div>
        <div id="barcode-scanner-region" ref={containerRef} className="aspect-square" />
        {error && <p className="text-sm text-brick p-4">{error}</p>}
      </div>
    </div>
  );
}
