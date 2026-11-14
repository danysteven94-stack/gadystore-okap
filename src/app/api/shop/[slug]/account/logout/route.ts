import { NextRequest, NextResponse } from "next/server";
import { clearCustomerCookie } from "@/lib/shop-customer";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const res = NextResponse.json({ ok: true });
  clearCustomerCookie(res, slug);
  return res;
}
