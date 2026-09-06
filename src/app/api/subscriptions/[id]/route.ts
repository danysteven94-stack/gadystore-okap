import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/upstash";
import { verifySession } from "@/lib/auth";
import type { Subscription } from "@/app/api/subscriptions/route";

async function getSession(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  return token ? verifySession(token) : null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });

  const { id } = await params;
  const sub = await redis.hgetall<Subscription>(`subscription:${id}`);
  if (!sub) return NextResponse.json({ error: "Abònman pa jwenn." }, { status: 404 });

  const body = await req.json();
  if (body.status !== "cancelled" && body.status !== "active") {
    return NextResponse.json({ error: "Estati envalid." }, { status: 400 });
  }

  await redis.hset(`subscription:${id}`, { status: body.status });
  return NextResponse.json({ subscription: { ...sub, status: body.status } });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });

  const { id } = await params;
  const sub = await redis.hgetall<Subscription>(`subscription:${id}`);
  if (!sub) return NextResponse.json({ error: "Abònman pa jwenn." }, { status: 404 });

  await redis.del(`subscription:${id}`);
  await redis.srem(`business:${sub.businessId}:subscriptions`, id);

  return NextResponse.json({ ok: true });
}
