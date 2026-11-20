"use client";

import { useEffect, useState } from "react";
import type { UserRole } from "@/lib/permissions";

// Yon sèl demann /api/auth/me pou tout konpozan yo (sidebar, drawer, paj yo).
let cached: Promise<UserRole | null> | null = null;
let cachedAt = 0;
const TTL = 30_000; // 30 s: si yon lòt itilizatè konekte nan menm tab la, wòl la rafrechi vit

/** Rele apre yon koneksyon/dekoneksyon pou pa kenbe wòl yon lòt itilizatè. */
export function resetRole() {
  cached = null;
}

function fetchRole(): Promise<UserRole | null> {
  if (!cached || Date.now() - cachedAt > TTL) {
    cachedAt = Date.now();
    cached = fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => (d?.role as UserRole | undefined) ?? null)
      .catch(() => {
        cached = null; // eseye ankò pwochen fwa
        return null;
      });
  }
  return cached;
}

/** Wòl itilizatè a (null pandan l ap chaje). UI sèlman: sèvè a toujou aplike règ yo tou. */
export function useRole(): UserRole | null {
  const [role, setRole] = useState<UserRole | null>(null);
  useEffect(() => {
    let alive = true;
    fetchRole().then((r) => alive && setRole(r));
    return () => {
      alive = false;
    };
  }, []);
  return role;
}
