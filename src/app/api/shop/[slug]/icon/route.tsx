import { NextRequest, NextResponse } from "next/server";
import { ImageResponse } from "next/og";
import { redis } from "@/lib/upstash";
import { getBusinessBySlug } from "@/lib/shop";

export const runtime = "nodejs";

// Ikòn app boutik la, jenere ak LOGO boutik la.
//   ?size=192|512|180|1024|2732   ?kind=any (default) | maskable | splash
const SIZES = new Set([180, 192, 512, 1024, 2732]);

/** Logo a sove kòm data URL nan Redis. Satori (ImageResponse) li sèlman JPEG/PNG. */
async function logoDataUrl(shopLogo: unknown): Promise<string | null> {
  const m = String(shopLogo ?? "").match(/\/api\/img\/([0-9a-f-]{36})/i);
  if (!m) return null;
  const dataUrl = await redis.get<string>(`productimg:${m[1]}`);
  return dataUrl && /^data:image\/(jpeg|png);base64,/.test(dataUrl) ? dataUrl : null;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);
  if (!business) return new NextResponse("Not found", { status: 404 });

  const sp = req.nextUrl.searchParams;
  const asked = Number(sp.get("size"));
  const size = SIZES.has(asked) ? asked : 512;
  const kind = sp.get("kind") === "maskable" ? "maskable" : sp.get("kind") === "splash" ? "splash" : "any";

  const name = String(business.shopName || business.name || "B");
  const letter = name.trim().charAt(0).toUpperCase() || "B";
  const logo = await logoDataUrl(business.shopLogo);

  // maskable: kontni dwe rete nan 80% santral la (Android ka koupe bò yo)
  const inner = kind === "maskable" ? Math.round(size * 0.62) : kind === "splash" ? Math.round(size * 0.28) : size;
  const bg = kind === "any" && !logo ? "#111111" : "#FFFFFF";

  const mark = logo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logo}
      width={inner}
      height={inner}
      style={{
        width: inner,
        height: inner,
        objectFit: "cover",
        borderRadius: kind === "any" ? 0 : Math.round(inner * 0.22),
      }}
    />
  ) : (
    <div
      style={{
        width: inner,
        height: inner,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#111111",
        color: "#FFFFFF",
        fontSize: Math.round(inner * 0.58),
        fontWeight: 700,
        borderRadius: kind === "any" ? 0 : Math.round(inner * 0.22),
      }}
    >
      {letter}
    </div>
  );

  return new ImageResponse(
    (
      <div style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", background: bg }}>
        {mark}
      </div>
    ),
    {
      width: size,
      height: size,
      headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" },
    }
  );
}
