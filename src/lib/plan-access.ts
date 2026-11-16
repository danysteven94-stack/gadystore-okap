import { redis } from "@/lib/upstash";
import { isSuperAdmin } from "@/lib/session";
import { PLANS, isPlanId, type PlanInfo } from "@/lib/plans";
import type { Business } from "@/types";

function parseIds(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  try {
    const v = JSON.parse(String(raw ?? "[]"));
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

/**
 * Plan efektif yon kont:
 *  - kont prensipal la = full
 *  - yon kont ki gen `plan` (kreye pa kont prensipal la) = plan sa a
 *  - lòt kont (anplwaye, admin segondè) eritye plan moun ki kreye yo
 *  - kont ki egziste deja san plan = full (pa kraze sa ki deja la)
 */
export async function getUserPlan(email: string, depth = 0): Promise<PlanInfo> {
  const e = (email ?? "").trim().toLowerCase();
  if (!e || isSuperAdmin(e) || depth > 4) return PLANS.full;
  const rec = await redis.hgetall<Record<string, unknown>>(`user:${e}`);
  if (!rec || !rec.id) return PLANS.full;
  if (isPlanId(rec.plan)) return PLANS[rec.plan];
  const creator = rec.createdBy ? String(rec.createdBy).toLowerCase() : "";
  if (creator && creator !== e) return getUserPlan(creator, depth + 1);
  return PLANS.full;
}

/** Imèl pwopriyetè yon antrepriz (admin ki gen antrepriz la). Sere sou antrepriz la apre premye rechèch. */
export async function getBusinessOwnerEmail(business: Business): Promise<string | null> {
  const known = (business as unknown as { ownerEmail?: string }).ownerEmail;
  if (known) return String(known).toLowerCase();

  const emails = await redis.smembers("users:all");
  for (const email of emails) {
    const rec = await redis.hgetall<Record<string, unknown>>(`user:${email}`);
    if (!rec || !rec.id || rec.role !== "admin") continue;
    if (parseIds(rec.businessIds).includes(business.id)) {
      await redis.hset(`business:${business.id}`, { ownerEmail: email.toLowerCase() });
      return email.toLowerCase();
    }
  }
  return null;
}

/** Eske plan pwopriyetè antrepriz la gen dwa a yon boutik piblik? Si nou pa jwenn pwopriyetè a, nou kite l mache. */
export async function shopAllowedForBusiness(business: Business): Promise<boolean> {
  const owner = await getBusinessOwnerEmail(business);
  if (!owner) return true;
  return (await getUserPlan(owner)).publicShop;
}

/** Eske itilizatè sa a (pwopriyetè oswa anplwaye) gen dwa a boutik piblik la? */
export async function userHasShop(email: string): Promise<boolean> {
  return (await getUserPlan(email)).publicShop;
}
