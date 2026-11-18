import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { redis } from "@/lib/upstash";
import { rateLimit } from "@/lib/shop";

// Resevwa erè navigatè yo (error boundaries). Piblik (kliyan boutik pa konekte),
// kidonk: limit pa IP, schema strik, gwosè limite, epi lis la limite a 200 antre / 14 jou.
const schema = z.object({
  scope: z.enum(["root", "dashboard", "boutik", "global"]),
  message: z.string().max(500),
  stack: z.string().max(2000).optional(),
  digest: z.string().max(64).optional(),
  path: z.string().max(300),
  ua: z.string().max(200).optional(),
});

export async function POST(req: NextRequest) {
  try {
    if (!(await rateLimit(req, "client-error", 20, 600))) {
      return new NextResponse(null, { status: 429 });
    }
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return new NextResponse(null, { status: 400 });

    const entry = JSON.stringify({ ...parsed.data, at: new Date().toISOString() });
    await redis.lpush("errors:client", entry);
    await redis.ltrim("errors:client", 0, 199);
    await redis.expire("errors:client", 14 * 24 * 3600);
    console.error("[client-error]", parsed.data.scope, parsed.data.path, parsed.data.message);
  } catch {
    // pa janm kraze pou yon rapò erè
  }
  return new NextResponse(null, { status: 204 });
}
