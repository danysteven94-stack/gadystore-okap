import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { redis, hsetClean } from "@/lib/upstash";
import { audit } from "@/lib/audit";
import { requireCapitalAccess } from "@/lib/capital-auth";
import { listInvestments, invalidateCapital } from "@/lib/capital";
import type { Investment } from "@/types";

const investmentSchema = z.object({
  businessId: z.string().min(1),
  amount: z.number().positive().max(1_000_000_000),
  source: z.enum(["personal", "loan", "partner", "other"]),
  sourceLabel: z.string().max(120).optional(), // ekz: "Prè Sogebank", "Jean"
  destination: z.enum(["cash", "bank"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  note: z.string().max(500).optional(),
});

export async function GET(req: NextRequest) {
  const businessId = req.nextUrl.searchParams.get("businessId");
  if (!businessId) return NextResponse.json({ error: "businessId obligatwa." }, { status: 400 });
  const auth = await requireCapitalAccess(req, businessId);
  if ("error" in auth) return auth.error;
  return NextResponse.json({ investments: await listInvestments(businessId) });
}

export async function POST(req: NextRequest) {
  const parsed = investmentSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const auth = await requireCapitalAccess(req, parsed.data.businessId);
  if ("error" in auth) return auth.error;

  const today = new Date().toISOString().slice(0, 10);
  const investment: Investment = {
    id: randomUUID(),
    ...parsed.data,
    sourceLabel: parsed.data.sourceLabel?.trim() || undefined,
    note: parsed.data.note?.trim() || undefined,
    date: parsed.data.date && parsed.data.date <= today ? parsed.data.date : today,
    createdAt: new Date().toISOString(),
  };
  await hsetClean(`investment:${investment.id}`, investment);
  await redis.lpush(`business:${investment.businessId}:investments`, investment.id);
  await invalidateCapital(investment.businessId);

  await audit(req, { email: auth.session.email, role: auth.session.role }, {
    action: "investment.create",
    businessId: investment.businessId,
    target: { type: "investment", id: investment.id, label: investment.sourceLabel ?? investment.source },
    meta: { amount: investment.amount, source: investment.source, destination: investment.destination, date: investment.date },
  });
  return NextResponse.json({ investment }, { status: 201 });
}
