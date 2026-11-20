import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/upstash";
import { verifySession, can, isSuperAdmin } from "@/lib/auth";
import { userOwnsBusiness } from "@/lib/shop";
import { pageMeta, parsePage } from "@/lib/pagination";
import { isYmd } from "@/lib/date-range";
import { AUDIT_ALL_KEY, auditBizKey, filterEntries, parseEntries } from "@/lib/audit";

const WINDOW = 2000; // nou fouye sèlman 2000 dènye antre yo (filtraj nan memwa)

/**
 * GET /api/audit?businessId=…            → jounal biznis la (Administratè ki posede l)
 * GET /api/audit                         → jounal GLOBAL (sèlman kont prensipal la)
 * Filt: action (egzak oswa prefiks "user."), actor, q, from, to — pajinasyon: limit, offset
 */
export async function GET(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });
  if (!can(session.role, "*")) {
    return NextResponse.json({ error: "Sèlman Administratè ka wè jounal odit la." }, { status: 403 });
  }

  const sp = req.nextUrl.searchParams;
  const businessId = sp.get("businessId");
  let key: string;
  if (businessId) {
    if (!(await userOwnsBusiness(session.email, businessId))) {
      return NextResponse.json({ error: "Aksè refize." }, { status: 403 });
    }
    key = auditBizKey(businessId);
  } else {
    if (!isSuperAdmin(session.email)) {
      return NextResponse.json({ error: "Jounal global la se pou kont prensipal la sèlman." }, { status: 403 });
    }
    key = AUDIT_ALL_KEY;
  }

  const from = sp.get("from");
  const to = sp.get("to");
  const { limit, offset } = parsePage(sp, { defaultLimit: 50, maxLimit: 100 });

  const raw = await redis.lrange(key, 0, WINDOW - 1);
  const filtered = filterEntries(parseEntries(raw), {
    action: sp.get("action")?.slice(0, 40) || undefined,
    actor: sp.get("actor")?.slice(0, 120) || undefined,
    q: sp.get("q")?.slice(0, 120) || undefined,
    from: isYmd(from) ? from : undefined,
    to: isYmd(to) ? to : undefined,
  });
  const entries = filtered.slice(offset, offset + limit);
  return NextResponse.json({ entries, ...pageMeta(filtered.length, offset, entries.length), windowSize: Math.min(raw.length, WINDOW) });
}
