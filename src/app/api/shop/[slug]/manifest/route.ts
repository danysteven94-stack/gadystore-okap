import { NextRequest, NextResponse } from "next/server";
import { getBusinessBySlug } from "@/lib/shop";

// Manifest PWA pou chak boutik: non, ikòn ak logo pwòp boutik la (pa Platfomnou).
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);
  if (!business) return new NextResponse("Not found", { status: 404 });

  const name = String(business.shopName || business.name);
  const logoId = String(business.shopLogo ?? "").match(/[0-9a-f-]{36}/i)?.[0]?.slice(0, 8) ?? "0";
  const icon = (size: number, kind = "any") => `/api/shop/${slug}/icon?size=${size}&kind=${kind}&v=${logoId}`;
  const base = `/boutik/${slug}`;

  const manifest = {
    id: base,
    name,
    short_name: name.length > 12 ? name.slice(0, 12).trim() : name,
    description: String(business.shopTagline || `Boutik ${name} sou entènèt`),
    start_url: `${base}?source=app`,
    scope: base,
    display: "standalone",
    orientation: "portrait",
    background_color: "#FFFFFF",
    theme_color: "#111111",
    lang: "ht",
    categories: ["shopping"],
    icons: [
      { src: icon(192), sizes: "192x192", type: "image/png", purpose: "any" },
      { src: icon(512), sizes: "512x512", type: "image/png", purpose: "any" },
      { src: icon(512, "maskable"), sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };

  return new NextResponse(JSON.stringify(manifest), {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=3600",
    },
  });
}
