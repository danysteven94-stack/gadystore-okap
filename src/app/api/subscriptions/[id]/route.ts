import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/upstash";
import { verifySession } from "@/lib/auth";
import type { Subscription } from "@/app/api/subscriptions/route";
import { canAccessSub, parseIds, paymentsOf, scopeKey } from "@/lib/subscriptions";
import { moveSaleDate } from "@/lib/subscription-sale";

async function getSession(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  return token ? verifySession(token) : null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });

  const { id } = await params;
  const sub = await redis.hgetall<Subscription>(`subscription:${id}`);
  if (!sub) return NextResponse.json({ error: "Abònman pa jwenn." }, { status: 404 });
  if (!(await canAccessSub(session.email, sub))) {
    return NextResponse.json({ error: "Aksè refize." }, { status: 403 });
  }

  const body = await req.json();

  // Korije non kliyan an (+ telefòn si l voye)
  if (typeof body.customerName === "string") {
    const customerName = body.customerName.trim().slice(0, 100);
    if (!customerName) return NextResponse.json({ error: "Non kliyan an obligatwa." }, { status: 400 });
    const update: Record<string, string> = { customerName };
    if (typeof body.customerPhone === "string") update.customerPhone = body.customerPhone.trim().slice(0, 30);
    await redis.hset(`subscription:${id}`, update);
    return NextResponse.json({ subscription: { ...sub, ...update } });
  }

  // Chanje nimewo telefòn/WhatsApp moun nan
  if (typeof body.customerPhone === "string") {
    const customerPhone = body.customerPhone.trim().slice(0, 30);
    await redis.hset(`subscription:${id}`, { customerPhone });
    return NextResponse.json({ subscription: { ...sub, customerPhone } });
  }

  // Chanje profil moun nan sou kont lan
  if (typeof body.profile === "string") {
    const profile = body.profile.trim().slice(0, 60);
    await redis.hset(`subscription:${id}`, { profile });
    return NextResponse.json({ subscription: { ...sub, profile } });
  }

  // Korije dat ak lè DÈNYE peman an
  if (typeof body.paidAt === "string") {
    const d = new Date(body.paidAt);
    if (isNaN(d.getTime())) return NextResponse.json({ error: "Dat peman an envalid." }, { status: 400 });
    if (paymentsOf(sub) <= 0) return NextResponse.json({ error: "Pa gen peman pou chanje." }, { status: 400 });
    const iso = d.toISOString();
    const paidDates = parseIds(sub.paidDates);
    if (paidDates.length) paidDates[paidDates.length - 1] = iso;
    else paidDates.push(iso);
    const saleId = parseIds(sub.saleIds).pop();
    if (saleId) await moveSaleDate(saleId, iso);
    await redis.hset(`subscription:${id}`, { paidDates: JSON.stringify(paidDates) });
    return NextResponse.json({ subscription: { ...sub, paidDates } });
  }

  if (body.status !== "cancelled" && body.status !== "active") {
    return NextResponse.json({ error: "Estati envalid." }, { status: 400 });
  }

  await redis.hset(`subscription:${id}`, { status: body.status });
  return NextResponse.json({ subscription: { ...sub, status: body.status } });
}

/**
 * Efase yon abònman. Sèlman si li pa peye (pa gen peman ki kontabilize).
 * Si li gen peman, anile peman yo anvan (DELETE sou /pay) oswa sèvi ak "Anile".
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });

  const { id } = await params;
  const sub = await redis.hgetall<Subscription>(`subscription:${id}`);
  if (!sub) return NextResponse.json({ error: "Abònman pa jwenn." }, { status: 404 });
  if (!(await canAccessSub(session.email, sub))) {
    return NextResponse.json({ error: "Aksè refize." }, { status: 403 });
  }
  if (paymentsOf(sub) > 0) {
    return NextResponse.json(
      { error: "Abònman sa a gen peman. Anile peman yo anvan pou efase l." },
      { status: 409 }
    );
  }

  await redis.del(`subscription:${id}`);
  await redis.srem(scopeKey(String(sub.businessId ?? ""), String(sub.ownerEmail ?? session.email)), id);

  return NextResponse.json({ ok: true });
}
