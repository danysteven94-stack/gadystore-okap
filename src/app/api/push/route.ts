import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifySession } from "@/lib/auth";
import { saveWebSubscription, saveNativeToken, removeSubscription } from "@/lib/push";

async function getSession(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  return token ? verifySession(token) : null;
}

// Kle piblik VAPID pou navigatè a (pa sekrè)
export async function GET(req: NextRequest) {
  if (!(await getSession(req))) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });
  return NextResponse.json({ webPublicKey: process.env.VAPID_PUBLIC_KEY || null });
}

const subscribeSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("web"),
    subscription: z.object({
      endpoint: z.string().url().max(1000),
      keys: z.object({ p256dh: z.string().max(200), auth: z.string().max(100) }),
    }),
  }),
  z.object({ kind: z.literal("native"), token: z.string().min(20).max(500), platform: z.enum(["ios", "android"]) }),
]);

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });
  const parsed = subscribeSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Done envalid." }, { status: 400 });

  if (parsed.data.kind === "web") await saveWebSubscription(session.email, parsed.data.subscription);
  else await saveNativeToken(session.email, parsed.data.token, parsed.data.platform);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  await removeSubscription(session.email, {
    endpoint: typeof body.endpoint === "string" ? body.endpoint : undefined,
    token: typeof body.token === "string" ? body.token : undefined,
  });
  return NextResponse.json({ ok: true });
}
