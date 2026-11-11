import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/upstash";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse("Not found", { status: 404 });

  const dataUrl = await redis.get<string>(`productimg:${id}`);
  const m = dataUrl?.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
  if (!m) return new NextResponse("Not found", { status: 404 });

  return new NextResponse(Buffer.from(m[2], "base64"), {
    headers: {
      "Content-Type": m[1],
      // ID a se yon UUID inik: yon foto ki chanje jwenn yon nouvo ID, kidonk kach la ka rete pou tout tan.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
