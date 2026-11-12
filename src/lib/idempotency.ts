import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/upstash";

/**
 * Evite doub lè yon operasyon offline voye de fwa (repons pèdi, retry...).
 * Kliyan an voye X-Idempotency-Key; si kle a deja itilize → 200 {duplicate:true} san re-kreye anyen.
 * Si operasyon an echwe (>=400) kle a lage pou retry posib.
 */
export function withIdempotency(
  scope: string,
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const key = req.headers.get("x-idempotency-key");
    if (!key || key.length > 100) return handler(req);
    const k = `idem:${scope}:${key}`;
    const claimed = await redis.set(k, "1", { nx: true, ex: 60 * 60 * 24 * 7 });
    if (!claimed) return NextResponse.json({ ok: true, duplicate: true }, { status: 200 });
    try {
      const res = await handler(req);
      if (res.status >= 400) await redis.del(k);
      return res;
    } catch (err) {
      await redis.del(k);
      throw err;
    }
  };
}
