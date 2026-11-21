import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { redis } from "@/lib/upstash";
import { audit } from "@/lib/audit";
import { requireCapitalAccess } from "@/lib/capital-auth";
import { invalidateCapital } from "@/lib/capital";
import type { Investment } from "@/types";

const patchSchema = z.object({
  amount: z.number().positive().max(1_000_000_000).optional(),
  source: z.enum(["personal", "loan", "partner", "other"]).optional(),
  sourceLabel: z.string().max(120).optional(), // "" = retire
  destination: z.enum(["cash", "bank"]).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  note: z.string().max(500).optional(), // "" = retire
});

async function load(req: NextRequest, id: string) {
  const inv = await redis.hgetall<Investment>(`investment:${id}`);
  if (!inv || !inv.id) return { error: NextResponse.json({ error: "Envestisman pa jwenn." }, { status: 404 }) } as const;
  const auth = await requireCapitalAccess(req, inv.businessId);
  if ("error" in auth) return { error: auth.error } as const;
  return { inv, session: auth.session } as const;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const loaded = await load(req, id);
  if ("error" in loaded) return loaded.error;
  const { inv, session } = loaded;

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { sourceLabel, note, date, ...rest } = parsed.data;

  const updates: Record<string, unknown> = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined));
  const today = new Date().toISOString().slice(0, 10);
  if (date !== undefined) updates.date = date <= today ? date : today;
  if (Object.keys(updates).length) await redis.hset(`investment:${id}`, updates);
  for (const [field, val] of [["sourceLabel", sourceLabel], ["note", note]] as const) {
    if (val === undefined) continue;
    if (val.trim()) await redis.hset(`investment:${id}`, { [field]: val.trim() });
    else await redis.hdel(`investment:${id}`, field);
  }

  const updated = await redis.hgetall<Investment>(`investment:${id}`);
  await invalidateCapital(inv.businessId);
  await audit(req, { email: session.email, role: session.role }, {
    action: "investment.update",
    businessId: inv.businessId,
    target: { type: "investment", id, label: String(inv.sourceLabel ?? inv.source) },
    meta: { before: { amount: Number(inv.amount), source: inv.source, destination: inv.destination, date: inv.date }, after: { amount: Number(updated?.amount), source: updated?.source, destination: updated?.destination, date: updated?.date } },
  });
  return NextResponse.json({ investment: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const loaded = await load(req, id);
  if ("error" in loaded) return loaded.error;
  const { inv, session } = loaded;

  await redis.lrem(`business:${inv.businessId}:investments`, 0, id);
  await redis.del(`investment:${id}`);
  await invalidateCapital(inv.businessId);
  await audit(req, { email: session.email, role: session.role }, {
    action: "investment.delete",
    businessId: inv.businessId,
    target: { type: "investment", id, label: String(inv.sourceLabel ?? inv.source) },
    meta: { amount: Number(inv.amount), source: inv.source, destination: inv.destination, date: inv.date },
  });
  return NextResponse.json({ ok: true });
}
