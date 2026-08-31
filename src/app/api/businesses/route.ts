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

  // Li businessIds fre dirèkteman sou itilizatè a (sous verite), paske JWT la
  // ka pa mete ajou si yon antrepriz te kreye apre dènye koneksyon an.
  const userRecord = await redis.hgetall<{ businessIds?: string | string[] }>(
    `user:${session.email}`
  );
  const rawIds = userRecord?.businessIds;
  const businessIds: string[] = Array.isArray(rawIds)
    ? rawIds
    : JSON.parse(rawIds || "[]");

  const businesses = businessIds.length
    ? await Promise.all(businessIds.map((id) => redis.hgetall<Business>(`business:${id}`)))
    : [];

  return NextResponse.json({ businesses: businesses.filter(Boolean) });
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Sèl admin ka ajoute yon antrepriz." }, { status: 403 });
  }

  const body = await req.json();
  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "Non antrepriz la obligatwa." }, { status: 400 });
  }
  const id = randomUUID();

  const business: Business = {
    id,
    name: body.name,
    icon: body.icon || "store",
    tags: Array.isArray(body.tags) ? body.tags : [],
    currency: body.currency || "HTG",
    taxRate: body.taxRate ?? 0,
    ownerId: session.userId,
    createdAt: new Date().toISOString(),
  };

  await redis.hset(`business:${id}`, { ...business });
  await redis.sadd(`user:${session.userId}:businesses`, id);
  await redis.sadd("businesses:all", id);

  // Ajoute nouvo antrepriz la nan lis businessIds itilizatè a, pou l parèt
  // imedyatman san yo pa bezwen rekonekte.
  const userRecord = await redis.hgetall<{ businessIds?: string | string[] }>(
    `user:${session.email}`
  );
  const rawIds = userRecord?.businessIds;
  const currentIds: string[] = Array.isArray(rawIds)
    ? rawIds
    : JSON.parse(rawIds || "[]");
  await redis.hset(`user:${session.email}`, {
    businessIds: JSON.stringify([...currentIds, id]),
  });

  return NextResponse.json({ business }, { status: 201 });
}
