import { NextRequest, NextResponse } from "next/server";
import { storeImage } from "@/lib/image-store";
import { getSessionFromReq } from "@/lib/shop";
import { can } from "@/lib/auth";

// Foto a konprese sou telefòn/navigatè a anvan (~800px JPEG). Li ale sou Vercel Blob
// (si BLOB_READ_WRITE_TOKEN defini), sinon nan Upstash. Limit sekirite: 600 KB pou chak foto.
const MAX_BYTES = 600 * 1024;
const DATA_URL = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;

export async function POST(req: NextRequest) {
  const session = await getSessionFromReq(req);
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });
  if (!can(session.role, "products:write")) {
    return NextResponse.json({ error: "Wòl ou pa otorize pou modifye pwodwi yo." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const dataUrl: unknown = body?.dataUrl;
  if (typeof dataUrl !== "string" || !DATA_URL.test(dataUrl)) {
    return NextResponse.json({ error: "Fòma foto pa valid." }, { status: 400 });
  }
  if (dataUrl.length * 0.75 > MAX_BYTES) {
    return NextResponse.json({ error: "Foto a two gwo (max 600 KB)." }, { status: 413 });
  }

  try {
    return NextResponse.json({ url: await storeImage(dataUrl) }, { status: 201 });
  } catch (err) {
    console.error("image upload error", err);
    return NextResponse.json({ error: "Pa ka sove foto a. Eseye ankò." }, { status: 502 });
  }
}
