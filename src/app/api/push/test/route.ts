import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { sendToUser } from "@/lib/push";
import { rateLimit } from "@/lib/shop";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });
  if (!(await rateLimit(req, "push-test", 10, 600))) {
    return NextResponse.json({ error: "Twòp tès. Tann yon ti moman." }, { status: 429 });
  }
  const sent = await sendToUser(session.email, {
    title: "Platfomnou ✅",
    body: "Notifikasyon yo fonksyone sou aparèy sa a.",
    url: "/dashboard",
    tag: "test",
  });
  return NextResponse.json({ ok: true, sent });
}
