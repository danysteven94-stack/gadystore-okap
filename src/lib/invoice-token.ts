import { createHmac, timingSafeEqual } from "crypto";

// Lyen piblik fakti: siyen ak HMAC, kidonk pa ka devine. Pa gen dat ekspirasyon (kliyan an ka rouvri l tout tan).
function secret() {
  const v = process.env.JWT_SECRET;
  if (!v && process.env.NODE_ENV === "production") throw new Error("JWT_SECRET manke.");
  return v || "dev-only-secret";
}

export type InvoiceKind = "sale" | "order";

export function signInvoice(kind: InvoiceKind, id: string) {
  return createHmac("sha256", secret()).update(`invoice:${kind}:${id}`).digest("hex").slice(0, 32);
}

export function verifyInvoice(kind: InvoiceKind, id: string, token: string) {
  const a = Buffer.from(signInvoice(kind, id));
  const b = Buffer.from(token || "");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Nimewo telefòn pou wa.me: sèlman chif; 8 chif = Ayiti (+509). */
export function waNumber(raw: string) {
  const d = String(raw || "").replace(/\D/g, "");
  if (!d) return "";
  return d.length === 8 ? `509${d}` : d;
}
