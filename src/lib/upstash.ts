import { Redis } from "@upstash/redis";

// Variables d'environnement requises (à définir sur Vercel):
// UPSTASH_REDIS_REST_URL
// UPSTASH_REDIS_REST_TOKEN
export const redis = Redis.fromEnv();

/**
 * Convention des clés Upstash (voir /docs/data-model.md) :
 *   business:{businessId}                -> hash (infos entreprise)
 *   business:{businessId}:products       -> set d'IDs produits
 *   product:{productId}                  -> hash
 *   business:{businessId}:sales:{date}   -> list de ventes du jour (YYYY-MM-DD)
 *   sale:{saleId}                        -> hash
 *   business:{businessId}:customers      -> set d'IDs clients
 *   customer:{customerId}                -> hash
 *   business:{businessId}:suppliers      -> set d'IDs fournisseurs
 *   business:{businessId}:expenses:{date}-> list de dépenses
 *   user:{userId}                        -> hash (email, passwordHash, role, businessIds[])
 *   session:{token}                      -> hash (userId, expiresAt)
 */

export async function getJSON<T>(key: string): Promise<T | null> {
  const value = await redis.get<T>(key);
  return value ?? null;
}

export async function setJSON<T>(key: string, value: T): Promise<void> {
  await redis.set(key, value);
}
