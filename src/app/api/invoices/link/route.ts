import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromReq, userOwnsBusiness } from "@/lib/shop";
import { loadInvoice } from "@/lib/invoice-data";
import { signInvoice, waNumber } from "@/lib/invoice-token";

const schema = z.object({
  kind: z.enum(["sale", "order"]),
  id: z.string().min(1),
  phone: z.string().max(30).optional(), // vid = chwazi kontak nan WhatsApp
});

// POST { kind, id, phone? } → lyen PDF piblik + lyen WhatsApp (nenpòt nimewo) + lyen telechajman
export async function POST(req: NextRequest) {
  const session = await getSessionFromReq(req);
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Done envalid." }, { status: 400 });
  const { kind, id, phone } = parsed.data;

  const data = await loadInvoice(kind, id);
  if (!data) return NextResponse.json({ error: "Fakti pa jwenn." }, { status: 404 });
  if (!(await userOwnsBusiness(session.email, data.businessId))) {
    return NextResponse.json({ error: "Aksè refize." }, { status: 403 });
  }

  const token = signInvoice(kind, id);
  const pdfUrl = `${req.nextUrl.origin}/api/invoices/public/${kind}/${id}?t=${token}`;
  const message =
    `Bonjou${data.customer?.name ? ` ${data.customer.name}` : ""}! Men fakti ${data.invoiceNumber} ou nan ${data.business.name} ` +
    `(${Number(data.sale.total).toLocaleString("fr-FR")} ${data.business.currency}): ${pdfUrl}`;
  const to = waNumber(phone ?? "");

  return NextResponse.json({
    pdfUrl,
    downloadUrl: `${pdfUrl}&dl=1`,
    whatsappUrl: `https://wa.me/${to}?text=${encodeURIComponent(message)}`,
    defaultPhone: data.phone,
  });
}
