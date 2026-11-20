import { NextRequest, NextResponse } from "next/server";
import { sendDueSoonReminders } from "@/lib/billing-notify";
import { isCronAuthorized } from "@/lib/cron-auth";
import { sendSubscriptionReminders } from "@/lib/subscription-notify";

/** Appelé chaque jour par Vercel (voir vercel.json) : rappels d'échéance (abonnement plateforme + abonnements clients). */
export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req.headers.get("authorization"), process.env.CRON_SECRET)) {
    return NextResponse.json({ error: "Pa otorize.", }, { status: 401 });
  }
  const sent = await sendDueSoonReminders();
  let subReminded = 0;
  try {
    subReminded = (await sendSubscriptionReminders()).length;
  } catch (e) {
    console.error("subscription reminders failed", e);
  }
  return NextResponse.json({ reminded: sent.length, subscriptionsReminded: subReminded });
}
