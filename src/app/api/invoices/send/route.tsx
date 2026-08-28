import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { renderToBuffer } from "@react-pdf/renderer";
import { redis } from "@/lib/upstash";
import { verifySession } from "@/lib/auth";
import { InvoiceDocument } from "@/lib/pdf/invoice";
import type { Business, Customer, Sale } from "@/types";

const sendSchema = z.object({
  saleId: z.string(),
  channel: z.enum(["email", "whatsapp"]),
  to: z.string().optional(), // imèl oswa nimewo telefòn; sinon pran sa kliyan an genyen
});

// Nécessite RESEND_API_KEY dans .env.local (voir .env.example)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });

  const body = await req.json();
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { saleId, channel, to } = parsed.data;

  const sale = await redis.hgetall<Sale>(`sale:${saleId}`);
  if (!sale) return NextResponse.json({ error: "Vant pa jwenn." }, { status: 404 });

  const business = await redis.hgetall<Business>(`business:${sale.businessId}`);
  if (!business) return NextResponse.json({ error: "Antrepriz pa jwenn." }, { status: 404 });

  const customer = sale.customerId
    ? await redis.hgetall<Customer>(`customer:${sale.customerId}`)
    : undefined;

  const invoiceNumber = sale.id.slice(0, 8).toUpperCase();

  if (channel === "whatsapp") {
    const phone = (to ?? customer?.phone ?? "").replace(/\D/g, "");
    if (!phone) {
      return NextResponse.json(
        { error: "Nimewo telefòn kliyan an manke." },
        { status: 400 }
      );
    }
    const invoiceUrl = `${req.nextUrl.origin}/api/invoices/${saleId}`;
    const message = encodeURIComponent(
      `Bonjou! Men fakti ${invoiceNumber} ou nan ${business.name}: ${invoiceUrl}`
    );
    return NextResponse.json({ whatsappUrl: `https://wa.me/${phone}?text=${message}` });
  }

  // channel === "email"
  const email = to ?? customer?.email;
  if (!email) {
    return NextResponse.json({ error: "Imèl kliyan an manke." }, { status: 400 });
  }
  if (!resend) {
    return NextResponse.json(
      { error: "RESEND_API_KEY pa konfigire sou sèvè a." },
      { status: 500 }
    );
  }

  const pdfBuffer = await renderToBuffer(
    <InvoiceDocument
      business={business}
      sale={sale}
      customer={customer ?? undefined}
      invoiceNumber={invoiceNumber}
    />
  );

  await resend.emails.send({
    from: `${business.name} <fakti@${process.env.SEND_DOMAIN ?? "example.com"}>`,
    to: email,
    subject: `Fakti ${invoiceNumber} — ${business.name}`,
    text: `Bonjou, men fakti ${invoiceNumber} ou. Mèsi pou konfyans ou!`,
    attachments: [
      { filename: `fakti-${invoiceNumber}.pdf`, content: pdfBuffer },
    ],
  });

  return NextResponse.json({ ok: true, sentTo: email });
}
