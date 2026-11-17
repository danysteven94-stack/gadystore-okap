import { redis } from "@/lib/upstash";
import { SUPER_ADMIN_EMAIL } from "@/lib/session";
import { isTrue } from "@/lib/password";
import { billingInfo } from "@/lib/user-billing";

/**
 * Revni mensyèl abònman itilizatè yo = somasyon `monthlyPrice` tout itilizatè
 * aktif yo (menm lojik ak `summary.monthlyRevenue` nan /api/user-billing).
 * Pou kont prensipal la sèlman — moun ki rele l la dwe verifye sa anvan.
 */
export async function getMonthlySubscriptionRevenue(): Promise<number> {
  const emails = await redis.smembers("users:all");
  const prices = await Promise.all(
    emails.map(async (email) => {
      if (email.toLowerCase() === SUPER_ADMIN_EMAIL) return 0;
      const r = await redis.hgetall<Record<string, unknown>>(`user:${email}`);
      if (!r || !r.id) return 0;
      if (isTrue(r.disabled)) return 0;
      const createdAt = r.createdAt ? String(r.createdAt) : "";
      const paidMonths = r.paidMonths === undefined || r.paidMonths === null ? 1 : Number(r.paidMonths) || 0;
      if (!billingInfo(createdAt, paidMonths)) return 0;
      return Number(r.monthlyPrice) || 0;
    })
  );
  return prices.reduce((s, p) => s + p, 0);
}
