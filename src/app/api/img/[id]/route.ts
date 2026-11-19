import { NextRequest, NextResponse } from "next/server";
import { loadImage } from "@/lib/image-store";

const IMMUTABLE = "public, max-age=31536000, immutable";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse("Not found", { status: 404 });

  const img = await loadImage(id);
  if (!img) return new NextResponse("Not found", { status: 404 });

  // Foto sou Vercel Blob: redireksyon (CDN a sèvi fichye a, fonksyon an pa pase bandwidth).
  if (img.kind === "url") {
    return new NextResponse(null, { status: 307, headers: { Location: img.url, "Cache-Control": IMMUTABLE } });
  }

  // Ansyen foto (data URL nan Redis) — ID a se yon UUID inik, kidonk kach la ka rete pou tout tan.
  return new NextResponse(new Uint8Array(img.buffer), {
    headers: { "Content-Type": img.contentType, "Cache-Control": IMMUTABLE },
  });
}
