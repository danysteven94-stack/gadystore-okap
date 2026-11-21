import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { redis } from "@/lib/upstash";
import { verifySession } from "@/lib/auth";
import type { Business } from "@/types";
import { getUserPlan } from "@/lib/plan-access";
import { businessLimitMessage } from "@/lib/plans";
import { getUserBusinessIds } from "@/lib/shop";

async function getSession(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  return token ? verifySession(token) : null;
}

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });

  try {
    const email = session.email.trim().toLowerCase();

    // Sous verite: dosye itilizatè a nan Redis (JWT la ka pa ajou).
    // Lekti sekirize: yon valè koripti pa dwe fè tout wout la tonbe (500).
    const ids = new Set<string>(await getUserBusinessIds(email));

    // Filé sekirite: si lis la vid, eseye tou ansanm ki kreye pa kreyasyon an
    // (user:{userId}:businesses) pou pa pèdi done ki egziste deja.
    if (ids.size === 0 && session.userId) {
      const extra = await redis.smembers(`user:${session.userId}:businesses`);
      for (const id of extra ?? []) ids.add(String(id));
    }

    const list = [...ids];
    const businesses = list.length
      ? await Promise.all(list.map((id) => redis.hgetall<Business>(`business:${id}`)))
      : [];

    return NextResponse.json({
      businesses: businesses.filter((b) => b && (b as Business).id),
    });
  } catch (e) {
    console.error("GET /api/businesses", e);
    return NextResponse.json(
      { error: "Pa ka li antrepriz yo.", detail: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
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
  // Limit antrepriz selon plan kont lan
  const plan = await getUserPlan(session.email);
  if (plan.maxBusinesses !== null) {
    const rec = await redis.hgetall<{ businessIds?: string | string[] }>(`user:${session.email}`);
    const raw = rec?.businessIds;
    const have: string[] = Array.isArray(raw) ? raw : JSON.parse(raw || "[]");
    if (have.length >= plan.maxBusinesses) {
      return NextResponse.json({ error: businessLimitMessage(plan.maxBusinesses), code: "plan_business_limit" }, { status: 403 });
    }
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

  await redis.hset(`business:${id}`, { ...business, ownerEmail: session.email.toLowerCase() });
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
