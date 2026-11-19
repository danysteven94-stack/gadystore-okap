import nodemailer from "nodemailer";
import { Resend } from "resend";

// Imèl sekirite (mo de pas bliye). Priyorite:
//  1) Gmail SMTP  -> GMAIL_USER + GMAIL_APP_PASSWORD (gratis, san domèn)
//  2) Resend      -> RESEND_API_KEY + SEND_DOMAIN (si w gen yon domèn verifye)

const gmailUser = process.env.GMAIL_USER;
const gmailPass = (process.env.GMAIL_APP_PASSWORD ?? "").replace(/\s/g, "");
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export function mailConfigured(): boolean {
  return Boolean((gmailUser && gmailPass) || (resend && process.env.SEND_DOMAIN));
}

export async function sendSecurityMail(opts: { to: string; subject: string; text: string }) {
  if (gmailUser && gmailPass) {
    const transport = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: gmailUser, pass: gmailPass },
    });
    await transport.sendMail({
      from: `Platfomnou <${gmailUser}>`,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
    });
    return;
  }
  if (resend) {
    await resend.emails.send({
      from: `Platfomnou <sekirite@${process.env.SEND_DOMAIN ?? "example.com"}>`,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
    });
    return;
  }
  throw new Error("Pa gen sèvis imèl konfigire.");
}
