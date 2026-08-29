import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { redis } from "@/lib/upstash";
import { verifySession } from "@/lib/auth";
import type { AppNotification } from "@/lib/notifications";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });

  const businessId = req.nextUrl.searchParams.get("businessId");
  if (!businessId) {
    return NextResponse.json({ error: "businessId obligatwa." }, { status: 400 });
  }

  const ids = await redis.lrange(`business:${businessId}:notifications`, 0, 49);
  const notifications = ids.length
    ? await Promise.all(ids.map((id) => redis.hgetall<AppNotification>(`notification:${id}`)))
    : [];

  const unreadCount = notifications.filter((n) => n && !n.read).length;

  return NextResponse.json({ notifications, unreadCount });
}

const markReadSchema = z.object({ notificationId: z.string() });

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });

  const body = await req.json();
  const parsed = markReadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "notificationId obligatwa." }, { status: 400 });
  }

  await redis.hset(`notification:${parsed.data.notificationId}`, { read: true });
  return NextResponse.json({ ok: true });
}
