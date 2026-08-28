import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/upstash";
import { verifySession, can } from "@/lib/auth";
import type { Business, Customer, Product, Sale } from "@/types";

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

  if (snapshot.business) {
    await redis.hset(
      `business:${snapshot.businessId}`,
      snapshot.business as unknown as Record<string, unknown>
    );
  }

  for (const product of snapshot.products) {
    if (product) {
      await redis.hset(`product:${product.id}`, product as unknown as Record<string, unknown>);
    }
  }

  for (const customer of snapshot.customers) {
    if (customer) {
      await redis.hset(
        `customer:${customer.id}`,
        customer as unknown as Record<string, unknown>
      );
    }
  }

  return NextResponse.json({
    restored: {
      business: !!snapshot.business,
      products: snapshot.products.length,
      customers: snapshot.customers.length,
    },
    fromBackup: backupId,
  });
}
