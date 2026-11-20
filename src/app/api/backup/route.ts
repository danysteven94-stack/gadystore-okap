import { NextRequest, NextResponse } from "next/server";
import { userOwnsBusiness } from "@/lib/shop";
import { redis } from "@/lib/upstash";
import { verifySession } from "@/lib/auth";
import { createBackup } from "@/lib/backup";

/**
 * Kreye yon backup konplè pou yon antrepriz (pwodwi, kliyan, vant 30 dènye jou).
 * Ka lanse chak jou via yon Vercel Cron Job (`vercel.json` → crons).
 */
export async function POST(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });

  const { businessId } = await req.json();
  if (!businessId) {
    return NextResponse.json({ error: "businessId obligatwa." }, { status: 400 });
  }
  if (!(await userOwnsBusiness(session.email, businessId))) {
    return NextResponse.json({ error: "Aksè refize." }, { status: 403 });
  }

  return NextResponse.json(await createBackup(businessId));
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });

  const businessId = req.nextUrl.searchParams.get("businessId");
  if (!businessId) {
    return NextResponse.json({ error: "businessId obligatwa." }, { status: 400 });
  }
  if (!(await userOwnsBusiness(session.email, businessId))) {
    return NextResponse.json({ error: "Aksè refize." }, { status: 403 });
  }

  const backupIds = await redis.lrange(`business:${businessId}:backups`, 0, -1);
  return NextResponse.json({ backups: backupIds });
}
