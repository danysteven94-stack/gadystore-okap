import type { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { redis } from "@/lib/upstash";
import { buildMeta, clientIp, type AuditAction, type AuditEntry } from "@/lib/audit-core";

export * from "@/lib/audit-core";

const KEEP_ALL = 10_000;
const KEEP_BIZ = 5_000;

export const AUDIT_ALL_KEY = "audit:all";
export const auditBizKey = (businessId: string) => `audit:biz:${businessId}`;

export interface AuditInput {
  action: AuditAction;
  businessId?: string;
  target?: { type: string; id?: string; label?: string };
  meta?: Record<string, unknown>;
}

/**
 * Anrejistre yon aksyon. JANM pa leve erè (yon pwoblèm nan jounal la pa dwe bloke yon vant oswa yon koneksyon).
 * Ekri nan `audit:all` (super admin) epi, si gen businessId, nan jounal biznis la tou.
 */
export async function audit(
  req: NextRequest | null,
  actor: { email?: string | null; role?: string | null } | null,
  input: AuditInput
): Promise<void> {
  try {
    const entry: AuditEntry = {
      id: randomUUID(),
      at: new Date().toISOString(),
      actor: (actor?.email ?? "anonim").toString().toLowerCase().slice(0, 120),
      ...(actor?.role ? { role: String(actor.role) } : {}),
      action: input.action,
      ...(input.businessId ? { businessId: input.businessId } : {}),
      ...(input.target ? { target: { ...input.target, label: input.target.label?.slice(0, 120) } } : {}),
      ...(input.meta ? { meta: buildMeta(input.meta) } : {}),
      ip: req ? clientIp(req.headers.get("x-forwarded-for"), req.headers.get("x-real-ip")) : undefined,
      ua: req ? (req.headers.get("user-agent") ?? "").slice(0, 120) || undefined : undefined,
    };
    const json = JSON.stringify(entry);
    const pipe = redis.pipeline();
    pipe.lpush(AUDIT_ALL_KEY, json);
    pipe.ltrim(AUDIT_ALL_KEY, 0, KEEP_ALL - 1);
    if (input.businessId) {
      pipe.lpush(auditBizKey(input.businessId), json);
      pipe.ltrim(auditBizKey(input.businessId), 0, KEEP_BIZ - 1);
    }
    await pipe.exec();
  } catch (err) {
    console.error("audit error", err);
  }
}
