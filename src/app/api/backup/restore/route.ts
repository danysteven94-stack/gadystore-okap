import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/upstash";
import { verifySession, can } from "@/lib/auth";
import type { Business, Customer, Product, Sale } from "@/types";
import { audit } from "@/lib/audit";
import { userOwnsBusiness } from "@/lib/shop";

interface Snapshot {
  businessId: string;
  business: Business | null;
  products: (Product | null)[];
  customers: (Customer | null)[];
  sales: Sale[];
  createdAt: string;
}

/**
 * Restore sèlman disponib pou Administrateur Prensipal, paske li ekrase
 * done aktyèl yo (pwodwi, kliyan) ak done backup la.
 */
export async function POST(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });
  if (!can(session.role, "*")) {
    return NextResponse.json(
      { error: "Sèl Administrateur Prensipal ka restore yon backup." },
      { status: 403 }
    );
  }

  const { backupId } = await req.json();
  if (!backupId) {
    return NextResponse.json({ error: "backupId obligatwa." }, { status: 400 });
  }

  const snapshot = await redis.get<Snapshot>(`backup:${backupId}`);
  if (!snapshot) {
    return NextResponse.json({ error: "Backup pa jwenn." }, { status: 404 });
  }

  // Backup la dwe pou yon biznis ki pou itilizatè a, epi li dwe nan lis backup biznis sa a.
  // (Menm repons "pa jwenn" pou pa revele backup lòt moun yo.)
  const ownsBusiness = await userOwnsBusiness(session.email, snapshot.businessId);
  const backupIds = ownsBusiness ? await redis.lrange(`business:${snapshot.businessId}:backups`, 0, -1) : [];
  if (!ownsBusiness || !backupIds.map(String).includes(String(backupId))) {
    return NextResponse.json({ error: "Backup pa jwenn." }, { status: 404 });
  }

  if (snapshot.business) {
    await redis.hset(
      `business:${snapshot.businessId}`,
      snapshot.business as unknown as Record<string, unknown>
    );
  }

  for (const product of snapshot.products) {
    if (product && String(product.businessId) === String(snapshot.businessId)) {
      await redis.hset(`product:${product.id}`, product as unknown as Record<string, unknown>);
    }
  }

  for (const customer of snapshot.customers) {
    if (customer && String((customer as { businessId?: unknown }).businessId) === String(snapshot.businessId)) {
      await redis.hset(
        `customer:${customer.id}`,
        customer as unknown as Record<string, unknown>
      );
    }
  }

  await audit(req, { email: session.email, role: session.role }, {
    action: "backup.restore",
    businessId: snapshot.businessId,
    target: { type: "backup", id: String(backupId) },
    meta: { products: snapshot.products.length, customers: snapshot.customers.length },
  });

  return NextResponse.json({
    restored: {
      business: !!snapshot.business,
      products: snapshot.products.length,
      customers: snapshot.customers.length,
    },
    fromBackup: backupId,
  });
}
