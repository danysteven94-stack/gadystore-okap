import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { redis } from "@/lib/upstash";
import { getSessionFromReq } from "@/lib/shop";

// Foto a konprese sou telefòn/navigatè a anvan (~800px JPEG), epi li estoke nan
// Upstash kòm yon data URL. Limit sekirite: 600 KB pou chak foto.
const MAX_BYTES = 600 * 1024;
const DATA_URL = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;

export async function POST(req: NextRequest) {
  const session = await getSessionFromReq(req);
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const dataUrl: unknown = body?.dataUrl;
  if (typeof dataUrl !== "string" || !DATA_URL.test(dataUrl)) {
    return NextResponse.json({ error: "Fòma foto pa valid." }, { status: 400 });
  }
  if (dataUrl.length * 0.75 > MAX_BYTES) {
    return NextResponse.json({ error: "Foto a two gwo (max 600 KB)." }, { status: 413 });
  }

  const id = randomUUID();
  await redis.set(`productimg:${id}`, dataUrl);
  return NextResponse.json({ url: `/api/img/${id}` }, { status: 201 });
}
