import { NextRequest, NextResponse } from "next/server";
import { userOwnsBusiness, getUserBusinessIds } from "@/lib/shop";
import { z } from "zod";
import { redis } from "@/lib/upstash";
import { verifySession } from "@/lib/auth";
import type { AppNotification } from "@/lib/notifications";
import type { Business } from "@/types";

const isRead = (n: { read?: unknown }) => n.read === true || n.read === "true";

async function getSession(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  return token ? await verifySession(token) : null;
}

/** Tout notifikasyon itilizatè a: yo nan antrepriz li yo + notifikasyon pèsonèl li yo (abònman). Pi resan an premye. */
async function collectAll(email: string, withNames = true) {
  const businessIds = await getUserBusinessIds(email);
  const [businessLists, userIds, businesses] = await Promise.all([
    Promise.all(businessIds.map((id) => redis.lrange(`business:${id}:notifications`, 0, 49))),
    redis.lrange(`user:${email.toLowerCase()}:notifications`, 0, 49),
    // Non antrepriz yo sèlman nesesè pou lis konplè a (pa pou senp konte a) — ekonomize kòmand.
    withNames
      ? Promise.all(businessIds.map((id) => redis.hgetall<Business>(`business:${id}`)))
      : Promise.resolve([] as (Business | null)[]),
  ]);
  const names = new Map<string, string>();
  businesses.forEach((b, i) => b && names.set(businessIds[i], String(b.name ?? "")));

  const ids = Array.from(new Set([...businessLists.flat(), ...userIds].map(String)));
  const rows = ids.length ? await Promise.all(ids.map((id) => redis.hgetall<AppNotification>(`notification:${id}`))) : [];
  const all = rows
    .filter((n): n is AppNotification => !!n && !!n.id)
    .map((n) => ({ ...n, read: isRead(n), businessName: n.businessId ? names.get(String(n.businessId)) ?? "" : "" }));
  all.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return all;
}

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });

  const businessId = req.nextUrl.searchParams.get("businessId");

  // Konte rapid (badj la): 1 sèl kòmand Redis lè valè a nan cache (90 s) olye
  // de li chak notifikasyon youn pa youn (dè santèn kòmand chak minit).
  if (!businessId && req.nextUrl.searchParams.get("count")) {
    const cacheKey = `unread:cache:${session.email.toLowerCase()}`;
    const cached = await redis.get<number | string>(cacheKey);
    if (cached !== null && cached !== undefined) {
      return NextResponse.json({ unreadCount: Number(cached) || 0 });
    }
    const all = await collectAll(session.email, false);
    const unreadCount = all.filter((n) => !n.read).length;
    await redis.set(cacheKey, unreadCount, { ex: 90 });
    return NextResponse.json({ unreadCount });
  }

  // Mòd ansyen: notifikasyon yon sèl antrepriz.
  if (businessId) {
    if (!(await userOwnsBusiness(session.email, businessId))) {
      return NextResponse.json({ error: "Aksè refize." }, { status: 403 });
    }
    const ids = await redis.lrange(`business:${businessId}:notifications`, 0, 49);
    const notifications = ids.length
      ? await Promise.all(ids.map((id) => redis.hgetall<AppNotification>(`notification:${id}`)))
      : [];
    const unreadCount = notifications.filter((n) => n && !isRead(n)).length;
    return NextResponse.json({ notifications, unreadCount });
  }

  // Mòd nouvo: tout notifikasyon itilizatè a (pou paj Notifikasyon an ak badj la).
  const all = await collectAll(session.email);
  const unreadCount = all.filter((n) => !n.read).length;
  if (req.nextUrl.searchParams.get("count")) return NextResponse.json({ unreadCount });
  const notifications = req.nextUrl.searchParams.get("unread") ? all.filter((n) => !n.read) : all;
  return NextResponse.json({ notifications, unreadCount });
}

const patchSchema = z.union([
  z.object({ notificationId: z.string() }),
  z.object({ all: z.literal(true) }),
]);

export async function PATCH(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "notificationId obligatwa." }, { status: 400 });
  }

  if ("all" in parsed.data) {
    const unread = (await collectAll(session.email)).filter((n) => !n.read);
    await Promise.all(unread.map((n) => redis.hset(`notification:${n.id}`, { read: true })));
    await redis.del(`unread:cache:${session.email.toLowerCase()}`);
    return NextResponse.json({ ok: true, marked: unread.length });
  }

  const id = parsed.data.notificationId;
  const notif = await redis.hgetall<{ businessId?: string; email?: string }>(`notification:${id}`);
  const mine = notif?.email
    ? String(notif.email).toLowerCase() === session.email.toLowerCase()
    : !!notif?.businessId && (await userOwnsBusiness(session.email, String(notif.businessId)));
  if (!mine) return NextResponse.json({ error: "Aksè refize." }, { status: 403 });
  await redis.hset(`notification:${id}`, { read: true });
  await redis.del(`unread:cache:${session.email.toLowerCase()}`);
  return NextResponse.json({ ok: true });
}
