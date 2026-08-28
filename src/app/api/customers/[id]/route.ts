import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { redis } from "@/lib/upstash";
import { verifySession } from "@/lib/auth";
import type { Customer } from "@/types";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
});

async function requireSession(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  return token ? verifySession(token) : null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession(req);
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });

  const { id } = await params;
  const existing = await redis.hgetall<Customer>(`customer:${id}`);
  if (!existing) return NextResponse.json({ error: "Kliyan pa jwenn." }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await redis.hset(`customer:${id}`, parsed.data as Record<string, unknown>);
  return NextResponse.json({ customer: { ...existing, ...parsed.data } });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession(req);
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });

  const { id } = await params;
  const existing = await redis.hgetall<Customer>(`customer:${id}`);
  if (!existing) return NextResponse.json({ error: "Kliyan pa jwenn." }, { status: 404 });

  await redis.del(`customer:${id}`);
  await redis.srem(`business:${existing.businessId}:customers`, id);

  return NextResponse.json({ ok: true });
}
