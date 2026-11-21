import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { userOwnsBusiness } from "@/lib/shop";
import { redis } from "@/lib/upstash";
import { verifySession, can } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { invalidateCapital } from "@/lib/capital";
import type { Expense } from "@/types";

// Modifye / efase yon depans (ka kote yon moun fè yon erè). Sèlman admin ak jestyonè
// (menm dwa ak jere pwodwi) — yon kesye ka ajoute depans men pa ka chanje oswa efase yo.
const patchSchema = z.object({
  category: z.enum(["salaires", "transport", "loyer", "electricite", "internet", "achat", "divers"]).optional(),
  amount: z.number().positive().optional(),
  note: z.string().max(500).optional(), // "" = retire nòt la
  source: z.enum(["cash", "bank"]).optional(),
});

async function load(req: NextRequest, id: string) {
  const token = req.cookies.get("session")?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return { error: NextResponse.json({ error: "Pa otorize." }, { status: 401 }) };
  if (!can(session.role, "products:write")) {
    return { error: NextResponse.json({ error: "Aksè refize." }, { status: 403 }) };
  }
  const expense = await redis.hgetall<Expense>(`expense:${id}`);
  if (!expense || !expense.id) {
    return { error: NextResponse.json({ error: "Depans pa jwenn." }, { status: 404 }) };
  }
  if (!(await userOwnsBusiness(session.email, expense.businessId))) {
    return { error: NextResponse.json({ error: "Aksè refize." }, { status: 403 }) };
  }
  return { session, expense };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const loaded = await load(req, id);
  if ("error" in loaded) return loaded.error;
  const { session, expense } = loaded;

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { note, ...rest } = parsed.data;
  const updates: Record<string, unknown> = Object.fromEntries(
    Object.entries(rest).filter(([, v]) => v !== undefined)
  );
  if (Object.keys(updates).length) await redis.hset(`expense:${id}`, updates);
  if (note !== undefined) {
    if (note.trim()) await redis.hset(`expense:${id}`, { note: note.trim() });
    else await redis.hdel(`expense:${id}`, "note");
  }

  const updated = await redis.hgetall<Expense>(`expense:${id}`);
  await invalidateCapital(expense.businessId);
  await audit(req, { email: session.email, role: session.role }, {
    action: "expense.update",
    businessId: expense.businessId,
    target: { type: "expense", id, label: String(expense.category) },
    meta: { before: { category: expense.category, amount: Number(expense.amount), source: expense.source ?? "cash" }, after: { category: updated?.category, amount: Number(updated?.amount), source: updated?.source ?? "cash" } },
  });
  return NextResponse.json({ expense: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const loaded = await load(req, id);
  if ("error" in loaded) return loaded.error;
  const { session, expense } = loaded;

  const day = String(expense.createdAt).slice(0, 10);
  await redis.lrem(`business:${expense.businessId}:expenses:${day}`, 0, id);
  await redis.del(`expense:${id}`);
  await invalidateCapital(expense.businessId);

  await audit(req, { email: session.email, role: session.role }, {
    action: "expense.delete",
    businessId: expense.businessId,
    target: { type: "expense", id, label: String(expense.category) },
    meta: { amount: Number(expense.amount), category: expense.category, note: expense.note ?? null },
  });
  return NextResponse.json({ ok: true });
}
