import { Resend } from "resend";
import { redis } from "@/lib/upstash";
import type { Order } from "@/app/api/orders/route";
import type { Business } from "@/types";

/**
 * Mesaj otomatik pou kliyan an (imèl + WhatsApp):
 *  - "placed"    → lè kòmand lan fenk plase
 *  - "delivered" → lè kòmand lan make livre
 *
 * Chak mesaj voye yon sèl fwa pa kòmand (kle Redis `ordermsg:{id}:{kind}` ak NX),
 * epi erè yo pa janm kraze kòmand lan.
 */

export type OrderMsgKind = "placed" | "delivered";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const WA_TOKEN = process.env.WHATSAPP_API_TOKEN; // token Meta Cloud API
const WA_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID; // ID nimewo biznis la (pa nimewo a li menm)
const WA_LANG = process.env.WHATSAPP_TEMPLATE_LANG || "fr";
const WA_TPL: Record<OrderMsgKind, string | undefined> = {
  placed: process.env.WHATSAPP_TEMPLATE_PLACED,
  delivered: process.env.WHATSAPP_TEMPLATE_DELIVERED,
};

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function shopName(b: Business) {
  return String(b.shopName || b.name);
}

function money(n: number, currency: string) {
  return `${Number(n).toLocaleString("fr-FR")} ${currency}`;
}

function trackUrl(b: Business, order: Order) {
  const base = (process.env.APP_URL || "").replace(/\/$/, "");
  if (!base || !b.slug) return "";
  return `${base}/shop/${b.slug}/track?code=${order.code}&phone=${encodeURIComponent(String(order.customerPhone ?? ""))}`;
}

function buildText(kind: OrderMsgKind, order: Order, b: Business) {
  const name = shopName(b);
  const total = money(Number(order.totalAmount), b.currency);
  const link = trackUrl(b, order);
  const lead = (Array.isArray(order.items) ? order.items : []).reduce((m, it) => Math.max(m, Number(it.leadDays) || 0), 0);
  if (kind === "placed") {
    const subject = `Kòmand #${order.code} resevwa — ${name}`;
    const text =
      `Bonjou ${order.customerName}, mèsi pou kòmand ou nan ${name}!\n\n` +
      `Kòmand #${order.code}\n${order.description}\nTotal: ${total}\n` +
      `${order.deliveryMethod === "pickup" ? "Ranmase nan boutik" : `Livrezon: ${order.customerAddress ?? ""}`}\n\n` +
      (lead > 0 ? `Delè pou resevwa pwodwi yo: ${lead} jou.\n` : "") +
      `N ap kontakte w byento pou konfime li.` +
      (link ? `\nSwiv kòmand ou: ${link}` : "");
    return { subject, text };
  }
  const subject = `Kòmand #${order.code} livre — ${name}`;
  const text =
    `Bonjou ${order.customerName}, kòmand #${order.code} ou a livre! 🎉\n` +
    `Total: ${total}\n\nMèsi pou konfyans ou nan ${name}.` +
    (link ? `\nDetay: ${link}` : "");
  return { subject, text };
}

async function sendEmail(kind: OrderMsgKind, order: Order, b: Business, to: string) {
  if (!resend) return;
  const { subject, text } = buildText(kind, order, b);
  const html = `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;line-height:1.5">${esc(text).replace(/\n/g, "<br/>")}</div>`;
  await resend.emails.send({
    from: `${shopName(b)} <kòmand@${process.env.SEND_DOMAIN ?? "example.com"}>`,
    to,
    subject,
    text,
    html,
    ...(b.email ? { replyTo: String(b.email) } : {}),
  });
}

async function sendWhatsApp(kind: OrderMsgKind, order: Order, b: Business, phone: string) {
  if (!WA_TOKEN || !WA_PHONE_ID) return;
  const to = phone.replace(/\D/g, "");
  if (to.length < 8) return;

  const tpl = WA_TPL[kind];
  const link = trackUrl(b, order) || "-";
  // Mesaj biznis kòmanse a dwe sèvi ak yon TEMPLATE Meta apwouve.
  // Paramèt: {{1}} non kliyan, {{2}} kòd kòmand, {{3}} total, {{4}} non boutik, {{5}} lyen swivi
  const body = tpl
    ? {
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: tpl,
          language: { code: WA_LANG },
          components: [
            {
              type: "body",
              parameters: [
                String(order.customerName),
                String(order.code),
                money(Number(order.totalAmount), b.currency),
                shopName(b),
                link,
              ].map((text) => ({ type: "text", text })),
            },
          ],
        },
      }
    : {
        // san template: mache sèlman si kliyan an te ekri nou nan 24 èdtan ki sot pase yo
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: buildText(kind, order, b).text },
      };

  const res = await fetch(`https://graph.facebook.com/v21.0/${WA_PHONE_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${WA_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`WhatsApp ${res.status}: ${(await res.text()).slice(0, 300)}`);
}

export async function sendOrderMessages(kind: OrderMsgKind, orderId: string) {
  try {
    const order = await redis.hgetall<Order>(`order:${orderId}`);
    if (!order || order.source !== "shop") return;
    if (String(order.status) === "cancelled") return;

    // Yon sèl fwa pa kòmand + pa kalite mesaj
    const first = await redis.set(`ordermsg:${orderId}:${kind}`, "1", { nx: true, ex: 60 * 60 * 24 * 90 });
    if (!first) return;

    const b = await redis.hgetall<Business>(`business:${order.businessId}`);
    if (!b) return;

    const email = String(order.customerEmail ?? "").trim();
    const phone = String(order.customerPhone ?? "");

    const jobs: Promise<unknown>[] = [];
    if (email) jobs.push(sendEmail(kind, order, b, email));
    if (phone) jobs.push(sendWhatsApp(kind, order, b, phone));

    const results = await Promise.allSettled(jobs);
    for (const r of results) if (r.status === "rejected") console.error("order message error", kind, orderId, r.reason);
  } catch (e) {
    console.error("order message error", kind, orderId, e);
  }
}
