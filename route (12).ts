import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/upstash";

/**
 * Vercel rele wout sa a chak jou (gade vercel.json) pou l fè backup
 * OTOMATIK pou tout antrepriz ki egziste, san pèsonn pa bezwen entèvni.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Pa otorize." }, { status: 401 });
  }

  const businessIds = await redis.smembers("businesses:all");
  const results = [];

  for (const businessId of businessIds) {
    const res = await fetch(`${req.nextUrl.origin}/api/backup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId }),
    });
    results.push({ businessId, ok: res.ok });
  }

  return NextResponse.json({ backedUp: results.length, results });
}
