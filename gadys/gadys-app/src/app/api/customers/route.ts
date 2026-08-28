import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { redis } from "@/lib/upstash";
import { verifySession } from "@/lib/auth";
import { pushNotification } from "@/lib/notifications";
import type { Customer } from "@/types";

const customerSchema = z.object({
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

  const ids = await redis.smembers(`business:${businessId}:customers`);
  const customers = ids.length
    ? await Promise.all(ids.map((id) => redis.hgetall<Customer>(`customer:${id}`)))
    : [];

  return NextResponse.json({ customers });
}

export async function POST(req: NextRequest) {
  const session = await requireSession(req);
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });

  const body = await req.json();
  const parsed = customerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const customer: Customer = { id: randomUUID(), ...parsed.data };

  await redis.hset(`customer:${customer.id}`, customer as unknown as Record<string, unknown>);
  await redis.sadd(`business:${customer.businessId}:customers`, customer.id);
  await pushNotification(customer.businessId, "new_customer", `Nouvo kliyan: ${customer.name}.`);

  return NextResponse.json({ customer }, { status: 201 });
}
