import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { redis } from "@/lib/upstash";
import { verifySession, hashPassword, can, type UserRole } from "@/lib/auth";

async function getSession(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  return token ? verifySession(token) : null;
}

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["admin", "gestionnaire", "caissier"]).default("gestionnaire"),
});

interface UserSummary {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
  businessCount: number;
}

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });
  if (!can(session.role, "*")) {
    return NextResponse.json({ error: "Sèl Administrateur ka jere itilizatè." }, { status: 403 });
  }

  const emails = await redis.smembers("users:all");
  const users: UserSummary[] = emails.length
    ? (
        await Promise.all(
          emails.map(async (email) => {
            const record = await redis.hgetall<Record<string, unknown>>(`user:${email}`);
            if (!record || !record.id) return null;
            const rawIds = record.businessIds as string | string[] | undefined;
            const businessIds: string[] = Array.isArray(rawIds)
              ? rawIds
              : JSON.parse((rawIds as string) || "[]");
            return {
              id: record.id as string,
              email: record.email as string,
              role: record.role as UserRole,
              createdAt: (record.createdAt as string) ?? "",
              businessCount: businessIds.length,
            };
          })
        )
      ).filter((u): u is UserSummary => !!u)
    : [];

  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });
  if (!can(session.role, "*")) {
    return NextResponse.json({ error: "Sèl Administrateur ka kreye itilizatè." }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Antre yon imèl valid ak yon mo de pas (6+ karaktè)." }, { status: 400 });
  }

  const { password, role } = parsed.data;
  const email = parsed.data.email.trim().toLowerCase();

  const existing = await redis.hgetall<Record<string, unknown>>(`user:${email}`);
  if (existing && existing.id) {
    return NextResponse.json({ error: "Yon itilizatè deja itilize imèl sa a." }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = {
    id: randomUUID(),
    email,
    passwordHash,
    role,
    // Chak nouvo itilizatè kòmanse ak pwòp done pa yo — pa gen okenn
    // antrepriz pataje ak lòt kont otomatikman.
    businessIds: JSON.stringify([]),
    createdAt: new Date().toISOString(),
  };

  await redis.hset(`user:${email}`, user);
  await redis.sadd("users:all", email);

  return NextResponse.json(
    { user: { id: user.id, email: user.email, role: user.role } },
    { status: 201 }
  );
}
