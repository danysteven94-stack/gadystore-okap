import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { redis } from "@/lib/upstash";
import { verifySession } from "@/lib/auth";
import { InvoiceDocument } from "@/lib/pdf/invoice";
import type { Business, Customer, Sale } from "@/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ saleId: string }> }
) {
  const { saleId } = await params;

  const token = req.cookies.get("session")?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });

  const sale = await redis.hgetall<Sale>(`sale:${saleId}`);
  if (!sale) {
    return NextResponse.json({ error: "Vant pa jwenn." }, { status: 404 });
  }

  const business = await redis.hgetall<Business>(`business:${sale.businessId}`);
  if (!business) {
    return NextResponse.json({ error: "Antrepriz pa jwenn." }, { status: 404 });
  }

  const customer = sale.customerId
    ? await redis.hgetall<Customer>(`customer:${sale.customerId}`)
    : undefined;

  const verifyUrl = `${req.nextUrl.origin}/verify/${sale.id}`;
  const qrCodeDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 0 });

  const buffer = await renderToBuffer(
    <InvoiceDocument
      business={business}
      sale={sale}
      customer={customer ?? undefined}
      invoiceNumber={sale.id.slice(0, 8).toUpperCase()}
      qrCodeDataUrl={qrCodeDataUrl}
    />
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="fakti-${sale.id.slice(0, 8)}.pdf"`,
    },
  });
}
