import { timingSafeEqual } from "crypto";

/**
 * Vercel Cron voye `Authorization: Bearer <CRON_SECRET>`.
 * FAIL-CLOSED: si CRON_SECRET pa defini, anyen pa otorize (anvan, "Bearer undefined" te pase).
 */
export function isCronAuthorized(authHeader: string | null, secret: string | undefined): boolean {
  if (!secret || secret.length < 16 || !authHeader) return false;
  const a = Buffer.from(authHeader);
  const b = Buffer.from(`Bearer ${secret}`);
  return a.length === b.length && timingSafeEqual(a, b);
}
