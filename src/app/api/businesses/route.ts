import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { redis } from "@/lib/upstash";
import { verifySession } from "@/lib/auth";
import type { Business } from "@/types";

async function getSession(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  return token ? verifySession(token) : null;
}

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });

  const businesses = await Promise.all(
    session.businessIds.map((id) => redis.hgetall<Business>(`business:${id}`))
  );

  return NextResponse.json({ businesses: businesses.filter(Boolean) });
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Sèl admin ka ajoute yon antrepriz." }, { status: 403 });
  }

  const body = await req.json();
  const id = randomUUID();

  const business: Business = {
    id,
    name: body.name,
    icon: body.icon || "store",
    currency: body.currency || "HTG",
    taxRate: body.taxRate ?? 0,
    ownerId: session.userId,
    createdAt: new Date().toISOString(),
  };

  await redis.hset(`business:${id}`, { ...business });
  await redis.sadd(`user:${session.userId}:businesses`, id);
  await redis.sadd("businesses:all", id);

  return NextResponse.json({ business }, { status: 201 });
}
