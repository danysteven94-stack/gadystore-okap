import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { redis, hsetClean } from "@/lib/upstash";
import { audit } from "@/lib/audit";
import { requireCapitalAccess } from "@/lib/capital-auth";
import { listTransfers } from "@/lib/capital";
import type { Transfer } from "@/types";

const transferSchema = z.object({
  businessId: z.string().min(1),
  direction: z.enum(["cash_to_bank", "bank_to_cash"]),
  amount: z.number().positive().max(1_000_000_000),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  note: z.string().max(500).optional(),
});

export async function GET(req: NextRequest) {
  const businessId = req.nextUrl.searchParams.get("businessId");
  if (!businessId) return NextResponse.json({ error: "businessId obligatwa." }, { status: 400 });
  const auth = await requireCapitalAccess(req, businessId);
  if ("error" in auth) return auth.error;
  return NextResponse.json({ transfers: await listTransfers(businessId) });
}

export async function POST(req: NextRequest) {
  const parsed = transferSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const auth = await requireCapitalAccess(req, parsed.data.businessId);
  if ("error" in auth) return auth.error;

  const today = new Date().toISOString().slice(0, 10);
  const transfer: Transfer = {
    id: randomUUID(),
    ...parsed.data,
    note: parsed.data.note?.trim() || undefined,
    date: parsed.data.date && parsed.data.date <= today ? parsed.data.date : today,
    createdAt: new Date().toISOString(),
  };
  await hsetClean(`transfer:${transfer.id}`, transfer);
  await redis.lpush(`business:${transfer.businessId}:transfers`, transfer.id);

  await audit(req, { email: auth.session.email, role: auth.session.role }, {
    action: "transfer.create",
    businessId: transfer.businessId,
    target: { type: "transfer", id: transfer.id },
    meta: { amount: transfer.amount, direction: transfer.direction, date: transfer.date },
  });
  return NextResponse.json({ transfer }, { status: 201 });
}
