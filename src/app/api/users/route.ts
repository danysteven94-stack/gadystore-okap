import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { redis } from "@/lib/upstash";
import { verifySession, hashPassword, can, isSuperAdmin, type UserRole } from "@/lib/auth";
import { generateTempPassword, isTrue } from "@/lib/password";

async function getSession(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  return token ? verifySession(token) : null;
}

const createUserSchema = z.object({
  email: z.string().email(),
  fullName: z.string().trim().min(2).max(80),
  role: z.enum(["admin", "gestionnaire", "caissier"]).default("gestionnaire"),
});

interface UserSummary {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt: string;
  lastLoginAt: string;
  mustChangePassword: boolean;
  disabled: boolean;
  businessCount: number;
  businessIds: string[];
  createdBy: string;
}

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Pa otorize." }, { status: 401 });
  if (!can(session.role, "*")) {
    return NextResponse.json({ error: "Sèl Administrateur ka jere itilizatè." }, { status: 403 });
  }

  // Sèl kont prensipal la wè TOUT kont yo. Lòt administratè yo wè SÈLMAN
  // kont segondè yo menm yo kreye (pou anplwaye yo) — pa gen lòt kont ki parèt.
  const isSuper = isSuperAdmin(session.email);
  const me = session.email.toLowerCase();
  const emails = await redis.smembers("users:all");
  const users: UserSummary[] = emails.length
    ? (
        await Promise.all(
          emails.map(async (email) => {
            const record = await redis.hgetall<Record<string, unknown>>(`user:${email}`);
            if (!record || !record.id) return null;
            const createdBy = record.createdBy ? String(record.createdBy).toLowerCase() : "";
            if (!isSuper && createdBy !== me) return null;
            const rawIds = record.businessIds as string | string[] | undefined;
            const businessIds: string[] = Array.isArray(rawIds)
              ? rawIds
              : JSON.parse((rawIds as string) || "[]");
            return {
              id: record.id as string,
              email: record.email as string,
              fullName: record.fullName ? String(record.fullName) : "",
              role: record.role as UserRole,
              createdAt: (record.createdAt as string) ?? "",
              lastLoginAt: record.lastLoginAt ? String(record.lastLoginAt) : "",
              mustChangePassword: isTrue(record.mustChangePassword),
              disabled: isTrue(record.disabled),
              businessCount: businessIds.length,
              businessIds,
              createdBy,
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
    return NextResponse.json({ error: "Antre non konplè a ak yon imèl valid." }, { status: 400 });
  }

  const { role, fullName } = parsed.data;
  const email = parsed.data.email.trim().toLowerCase();

  const existing = await redis.hgetall<Record<string, unknown>>(`user:${email}`);
  if (existing && existing.id) {
    return NextResponse.json({ error: "Yon itilizatè deja itilize imèl sa a." }, { status: 409 });
  }

  // Modpas tanporè jenere pa sèvè a. Li parèt YON SÈL FWA nan repons sa a,
  // epi itilizatè a dwe chanje l nan premye koneksyon an.
  const temporaryPassword = generateTempPassword();
  const passwordHash = await hashPassword(temporaryPassword);
  const user = {
    id: randomUUID(),
    email,
    fullName,
    passwordHash,
    mustChangePassword: true,
    createdBy: session.email,
    role,
    // Chak nouvo itilizatè kòmanse ak pwòp done pa yo — pa gen okenn
    // antrepriz pataje ak lòt kont otomatikman.
    businessIds: JSON.stringify([]),
    createdAt: new Date().toISOString(),
  };

  await redis.hset(`user:${email}`, user);
  await redis.sadd("users:all", email);

  return NextResponse.json(
    { user: { id: user.id, email: user.email, fullName, role: user.role }, temporaryPassword },
    { status: 201 }
  );
}
