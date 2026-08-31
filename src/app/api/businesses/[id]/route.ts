import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/upstash";
import { verifySession } from "@/lib/auth";
import type { Business } from "@/types";

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
  const existing = await redis.hgetall<Business>(`business:${id}`);
  if (!existing) return NextResponse.json({ error: "Antrepriz pa jwenn." }, { status: 404 });

  const body = await req.json();
  const updates: Partial<Business> = {};
  if (typeof body.name === "string" && body.name.trim()) updates.name = body.name.trim();
  if (typeof body.icon === "string") updates.icon = body.icon;
  if (Array.isArray(body.tags)) updates.tags = body.tags;
  if (typeof body.currency === "string") updates.currency = body.currency;
  if (typeof body.taxRate === "number") updates.taxRate = body.taxRate;
  if (typeof body.address === "string") updates.address = body.address;
  if (typeof body.phone === "string") updates.phone = body.phone;
  if (typeof body.email === "string") updates.email = body.email;

  await redis.hset(`business:${id}`, updates as Record<string, unknown>);
  return NextResponse.json({ business: { ...existing, ...updates } });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });

  const { id } = await params;
  const existing = await redis.hgetall<Business>(`business:${id}`);
  if (!existing) return NextResponse.json({ error: "Antrepriz pa jwenn." }, { status: 404 });

  await redis.del(`business:${id}`);
  await redis.srem(`user:${session.userId}:businesses`, id);
  await redis.srem("businesses:all", id);

  const userRecord = await redis.hgetall<{ businessIds?: string | string[] }>(
    `user:${session.email}`
  );
  const rawIds = userRecord?.businessIds;
  const currentIds: string[] = Array.isArray(rawIds) ? rawIds : JSON.parse(rawIds || "[]");
  await redis.hset(`user:${session.email}`, {
    businessIds: JSON.stringify(currentIds.filter((bid) => bid !== id)),
  });

  return NextResponse.json({ ok: true });
}
