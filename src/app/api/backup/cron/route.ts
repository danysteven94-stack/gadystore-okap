import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/upstash";
import { createBackup } from "@/lib/backup";
import { isCronAuthorized } from "@/lib/cron-auth";

/**
 * Vercel rele wout sa a chak jou (gade vercel.json) pou l fè backup
 * OTOMATIK pou tout antrepriz ki egziste, san pèsonn pa bezwen entèvni.
 * (Anvan, li rele /api/backup san sesyon → 401 chak fwa: pa t gen okenn backup otomatik.)
 */
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req.headers.get("authorization"), process.env.CRON_SECRET)) {
    return NextResponse.json({ error: "Pa otorize." }, { status: 401 });
  }

  const businessIds = await redis.smembers("businesses:all");
  const results: { businessId: string; ok: boolean }[] = [];

  for (const businessId of businessIds) {
    try {
      await createBackup(String(businessId));
      results.push({ businessId: String(businessId), ok: true });
    } catch (err) {
      console.error("backup cron failed", businessId, err);
      results.push({ businessId: String(businessId), ok: false });
    }
  }

  return NextResponse.json({ backedUp: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok).length, results });
}
