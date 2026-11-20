import { redis, hgetallMany } from "@/lib/upstash";
import type { Business, Customer, Product, Sale } from "@/types";

/** Kreye yon backup konplè (pwodwi, kliyan, vant 30 dènye jou) epi anrejistre l. Sèvi pa wout manyèl la ak cron la. */
export async function createBackup(businessId: string): Promise<{ backupId: string; createdAt: string }> {
  const business = await redis.hgetall<Business>(`business:${businessId}`);

  const [productIds, customerIds] = await Promise.all([
    redis.smembers(`business:${businessId}:products`),
    redis.smembers(`business:${businessId}:customers`),
  ]);
  const [products, customers] = await Promise.all([
    hgetallMany<Product>(productIds.map((id) => `product:${id}`)),
    hgetallMany<Customer>(customerIds.map((id) => `customer:${id}`)),
  ]);

  // Vant 30 dènye jou: lis jou yo nan yon sèl demann, epi tout vant yo nan yon lòt.
  const days: string[] = [];
  for (let i = 0; i < 30; i++) days.push(new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10));
  const pipe = redis.pipeline();
  for (const d of days) pipe.lrange(`business:${businessId}:sales:${d}`, 0, -1);
  const idLists = (await pipe.exec()) as string[][];
  const saleRecs = await hgetallMany<Sale>(idLists.flat().map((id) => `sale:${id}`));
  const sales = saleRecs.filter((s): s is Sale => !!s);

  const snapshot = { businessId, business, products, customers, sales, createdAt: new Date().toISOString() };

  const backupId = `${businessId}:${snapshot.createdAt.slice(0, 10)}`;
  await redis.set(`backup:${backupId}`, snapshot);
  // Pa double nan lis la si yo fè 2 backup menm jou a.
  await redis.lrem(`business:${businessId}:backups`, 0, backupId);
  await redis.lpush(`business:${businessId}:backups`, backupId);
  await redis.ltrim(`business:${businessId}:backups`, 0, 29); // 30 dènye backup

  return { backupId, createdAt: snapshot.createdAt };
}
