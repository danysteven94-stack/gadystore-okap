"use client";

import { useEffect, useState } from "react";
import { UserCog, Plus, Loader2, ShieldCheck, Trash2 } from "lucide-react";

interface UserSummary {
  id: string;
  email: string;
  role: "admin" | "gestionnaire" | "caissier";
  createdAt: string;
  businessCount: number;
}

const ROLE_LABELS: Record<UserSummary["role"], string> = {
  admin: "Administratè",
  gestionnaire: "Jesyonè",
  caissier: "Kesye",
};

const SUPER_ADMIN_EMAIL = "danystevenj@gmail.com";

const inputClass =
  "w-full border border-ink/15 dark:border-dark-border bg-white dark:bg-dark-surface rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30";

export default function UsersPage() {
  const [users, setUsers] = useState<UserSummary[] | null>(null);
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserSummary["role"]>("gestionnaire");
  const [saving, setSaving] = useState(false);
  const [deletingEmail, setDeletingEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);

  async function load() {
    try {
      const [meRes, usersRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/users"),
      ]);
      if (meRes.ok) {
        const me = await meRes.json();
        setCurrentEmail(me.email);
      }
      if (usersRes.status === 403) {
        setForbidden(true);
        setUsers([]);
        return;
      }
      const data = await usersRes.json();
      setUsers(data.users ?? []);
    } catch {
      setUsers([]);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const isSuperAdmin = currentEmail?.toLowerCase() === SUPER_ADMIN_EMAIL;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Pa ka kreye itilizatè a.");
        setSaving(false);
        return;
      }
      setEmail("");
      setPassword("");
      setRole("gestionnaire");
      setShowForm(false);
      await load();
    } catch {
      setError("Erè rezo — eseye ankò.");
    }
    setSaving(false);
  }

  async function handleDelete(targetEmail: string) {
    if (!confirm(`Efase kont "${targetEmail}" nèt? Sa pa ka anile.`)) return;
    setDeletingEmail(targetEmail);
    setError(null);
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(targetEmail)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Pa ka efase kont lan.");
      } else {
        await load();
      }
    } catch {
      setError("Erè rezo — eseye ankò.");
    }
    setDeletingEmail(null);
  }

  if (users === null) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 flex flex-col items-center text-ink/40 dark:text-paper/40">
        <Loader2 size={24} className="animate-spin mb-2" />
        <p className="text-sm">Ap chaje...</p>
      </main>
    );
  }

  if (forbidden) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 text-center">
        <ShieldCheck size={28} className="mx-auto mb-3 text-ink/30" />
        <p className="text-sm text-ink/60 dark:text-paper/60">
          Sèl Administratè prensipal la ka jere itilizatè yo.
        </p>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 lg:px-8 py-8 pb-24">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="font-display text-xl lg:text-2xl mb-1">Itilizatè</h1>
          <p className="text-sm text-ink/60 dark:text-paper/60">
            Chak kont gen pwòp antrepriz ak done pa yo — separe konplètman.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 bg-forest text-paper rounded-full px-4 py-2.5 text-sm font-medium shrink-0"
        >
          <Plus size={16} /> Nouvo kont
        </button>
      </div>

      {error && <p className="text-sm text-brick mb-4">{error}</p>}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-card border border-ink/10 dark:border-dark-border bg-white dark:bg-dark-surface p-5 mb-6 space-y-4"
        >
          <label className="block">
            <span className="block text-xs font-medium text-ink/70 dark:text-paper/70 mb-1">Imèl</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              required
            />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-ink/70 dark:text-paper/70 mb-1">
              Mo de pas (6+ karaktè)
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              minLength={6}
              required
            />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-ink/70 dark:text-paper/70 mb-1">Wòl</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserSummary["role"])}
              className={inputClass}
            >
              <option value="gestionnaire">Jesyonè — vant, stok, faktè</option>
              <option value="caissier">Kesye — vant, enprime faktè</option>
              <option value="admin">Administratè — aksè total (pwòp antrepriz)</option>
            </select>
          </label>
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-ink text-paper rounded-full py-2.5 text-sm font-medium disabled:opacity-50"
          >
            {saving ? "Ap kreye..." : "Kreye kont lan"}
          </button>
        </form>
      )}

      {users.length === 0 ? (
        <div className="text-center py-16 text-ink/40 dark:text-paper/40">
          <UserCog size={28} className="mx-auto mb-2" />
          <p className="text-sm">Pa gen lòt itilizatè.</p>
        </div>
      ) : (
        <div className="rounded-card border border-ink/10 dark:border-dark-border bg-white dark:bg-dark-surface overflow-hidden">
          {users.map((u, i) => {
            const isSuper = u.email.toLowerCase() === SUPER_ADMIN_EMAIL;
            return (
              <div
                key={u.id}
                className={`flex items-center justify-between px-4 py-3 text-sm ${
                  i > 0 ? "border-t border-ink/8 dark:border-dark-border/60" : ""
                }`}
              >
                <span>
                  {u.email}
                  {isSuper && (
                    <span className="ml-2 text-[10px] uppercase tracking-wide text-gold-dark">
                      Prensipal
                    </span>
                  )}
                  <span className="block text-xs text-ink/40 dark:text-paper/40">
                    {ROLE_LABELS[u.role]} · {u.businessCount} antrepriz
                  </span>
                </span>
                {isSuperAdmin && !isSuper && (
                  <button
                    onClick={() => handleDelete(u.email)}
                    disabled={deletingEmail === u.email}
                    aria-label={`Efase ${u.email}`}
                    className="text-brick disabled:opacity-40"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
