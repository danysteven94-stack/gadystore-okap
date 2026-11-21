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
 *   expense:{id}                         -> hash (category, amount, source cash|bank, note)
 *   business:{businessId}:investments    -> list d'IDs d'investissements (investment:{id} -> hash)
 *   business:{businessId}:transfers      -> list d'IDs de transferts caisse/banque (transfer:{id} -> hash)
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

/**
 * Menm bagay ak `redis.hset`, men li retire chan ki gen valè `undefined`
 * anvan l ekri yo — Upstash rejte kòmand ki gen "null args" si w pa fè sa
 * (sa rive fasil ak chan opsyonèl tankou customerId, imèl, barcode...).
 */
export async function hsetClean(
  key: string,
  obj: Record<string, unknown>
): Promise<void> {
  const clean = Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  );
  await redis.hset(key, clean);
}

/**
 * Li plizyè hash nan YON SÈL demann HTTP (pipeline) olye de N demann paralèl.
 * Retounen yon tab menm lòd ak `keys` (null si kle a pa egziste).
 */
export async function hgetallMany<T = Record<string, unknown>>(keys: string[]): Promise<(T | null)[]> {
  if (keys.length === 0) return [];
  const pipe = redis.pipeline();
  for (const k of keys) pipe.hgetall(k);
  const res = (await pipe.exec()) as (T | null)[];
  return res.map((r) => (r && typeof r === "object" && Object.keys(r).length ? r : null));
}

/** Menm bagay pou kèk chan sèlman (HMGET) — rapid pou kalkil total yo. */
export async function hmgetMany(keys: string[], fields: string[]): Promise<(Record<string, unknown> | null)[]> {
  if (keys.length === 0) return [];
  const pipe = redis.pipeline();
  for (const k of keys) pipe.hmget(k, ...fields);
  return (await pipe.exec()) as (Record<string, unknown> | null)[];
}
