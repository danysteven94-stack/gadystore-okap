import { NextRequest, NextResponse } from "next/server";
import { sendDueSoonReminders } from "@/lib/billing-notify";

/** Appelé chaque jour par Vercel (voir vercel.json) : rappel 3 jours avant l'échéance. */
export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Pa otorize." }, { status: 401 });
  }
  const sent = await sendDueSoonReminders();
  return NextResponse.json({ reminded: sent.length });
}
