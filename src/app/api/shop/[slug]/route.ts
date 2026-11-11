import { NextRequest, NextResponse } from "next/server";
import { getPublicShop } from "@/lib/shop";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const shop = await getPublicShop(slug);
  if (!shop) return NextResponse.json({ error: "Boutik pa jwenn." }, { status: 404 });
  return NextResponse.json({ shop }, { headers: { "Cache-Control": "no-store" } });
}
