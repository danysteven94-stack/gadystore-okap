import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { InvoiceDocument } from "@/lib/pdf/invoice";
import { loadInvoice } from "@/lib/invoice-data";
import { verifyInvoice, type InvoiceKind } from "@/lib/invoice-token";

export const runtime = "nodejs";

// Lyen piblik (siyen) pou fakti PDF — kliyan an ka louvri l san kont. ?dl=1 = telechaje.
export async function GET(req: NextRequest, { params }: { params: Promise<{ kind: string; id: string }> }) {
  const { kind, id } = await params;
  if (kind !== "sale" && kind !== "order") return NextResponse.json({ error: "Pa jwenn." }, { status: 404 });
  const t = req.nextUrl.searchParams.get("t") ?? "";
  if (!verifyInvoice(kind as InvoiceKind, id, t)) return NextResponse.json({ error: "Lyen envalid." }, { status: 403 });

  const data = await loadInvoice(kind as InvoiceKind, id);
  if (!data) return NextResponse.json({ error: "Fakti pa jwenn." }, { status: 404 });

  const verifyUrl = kind === "sale" ? `${req.nextUrl.origin}/verify/${id}` : undefined;
  const qrCodeDataUrl = verifyUrl ? await QRCode.toDataURL(verifyUrl, { margin: 0 }) : undefined;

  const buffer = await renderToBuffer(
    <InvoiceDocument
      business={data.business}
      sale={data.sale}
      customer={data.customer}
      invoiceNumber={data.invoiceNumber}
      qrCodeDataUrl={qrCodeDataUrl}
      extra={data.extra}
    />
  );

  const disp = req.nextUrl.searchParams.get("dl") === "1" ? "attachment" : "inline";
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${disp}; filename="fakti-${data.invoiceNumber}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
