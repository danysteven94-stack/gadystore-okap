import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { redis } from "@/lib/upstash";
import { verifySession } from "@/lib/auth";
import type { Supplier } from "@/types";

const supplierSchema = z.object({
  businessId: z.string(),
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
});

async function requireSession(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  return token ? verifySession(token) : null;
}

export async function GET(req: NextRequest) {
  const session = await requireSession(req);
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });

  const businessId = req.nextUrl.searchParams.get("businessId");
  if (!businessId) {
    return NextResponse.json({ error: "businessId obligatwa." }, { status: 400 });
  }

  const ids = await redis.smembers(`business:${businessId}:suppliers`);
  const suppliers = ids.length
    ? await Promise.all(ids.map((id) => redis.hgetall<Supplier>(`supplier:${id}`)))
    : [];

  return NextResponse.json({ suppliers });
}

export async function POST(req: NextRequest) {
  const session = await requireSession(req);
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });

  const body = await req.json();
  const parsed = supplierSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supplier: Supplier = { id: randomUUID(), ...parsed.data };

  await redis.hset(`supplier:${supplier.id}`, supplier as unknown as Record<string, unknown>);
  await redis.sadd(`business:${supplier.businessId}:suppliers`, supplier.id);

  return NextResponse.json({ supplier }, { status: 201 });
}
