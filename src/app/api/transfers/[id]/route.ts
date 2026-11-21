import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/upstash";
import { audit } from "@/lib/audit";
import { requireCapitalAccess } from "@/lib/capital-auth";
import type { Transfer } from "@/types";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tr = await redis.hgetall<Transfer>(`transfer:${id}`);
  if (!tr || !tr.id) return NextResponse.json({ error: "Transfè pa jwenn." }, { status: 404 });
  const auth = await requireCapitalAccess(req, tr.businessId);
  if ("error" in auth) return auth.error;

  await redis.lrem(`business:${tr.businessId}:transfers`, 0, id);
  await redis.del(`transfer:${id}`);
  await audit(req, { email: auth.session.email, role: auth.session.role }, {
    action: "transfer.delete",
    businessId: tr.businessId,
    target: { type: "transfer", id },
    meta: { amount: Number(tr.amount), direction: tr.direction, date: tr.date },
  });
  return NextResponse.json({ ok: true });
}
