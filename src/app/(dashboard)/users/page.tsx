"use client";

import { useEffect, useState } from "react";
import { UserCog, Plus, Loader2, ShieldCheck, Trash2, RefreshCw, Copy, Check, MessageCircle, KeyRound } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-provider";

type Role = "admin" | "gestionnaire" | "caissier";

interface UserSummary {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  createdAt: string;
  lastLoginAt: string;
  mustChangePassword: boolean;
  disabled: boolean;
  businessCount: number;
}

interface Credentials {
  kind: "created" | "reset";
  name: string;
  email: string;
  password: string;
}

const SUPER_ADMIN_EMAIL = "danystevenj@gmail.com";

const inputClass =
  "w-full border border-ink/15 dark:border-dark-border bg-white dark:bg-dark-surface rounded-xl px-3.5 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-forest/30";
const labelClass =
  "block text-[11px] font-bold tracking-[0.12em] uppercase text-ink/60 dark:text-paper/60 mb-1.5";

function fmtDate(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function UsersPage() {
  const { t } = useLanguage();
  const ROLE_LABELS: Record<Role, string> = {
    admin: t("users_role_label_admin"),
    gestionnaire: t("users_role_label_manager"),
    caissier: t("users_role_label_cashier"),
  };
  const [users, setUsers] = useState<UserSummary[] | null>(null);
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("gestionnaire");
  const [saving, setSaving] = useState(false);
  const [busyEmail, setBusyEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [cred, setCred] = useState<Credentials | null>(null);
  const [copied, setCopied] = useState(false);

  async function load() {
    try {
      const [meRes, usersRes] = await Promise.all([fetch("/api/auth/me"), fetch("/api/users")]);
      if (meRes.ok) setCurrentEmail((await meRes.json()).email);
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
    setCred(null);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Pa ka kreye itilizatè a.");
        setSaving(false);
        return;
      }
      setCred({ kind: "created", name: fullName, email: data.user.email, password: data.temporaryPassword });
      setFullName("");
      setEmail("");
      setRole("gestionnaire");
      setShowForm(false);
      await load();
    } catch {
      setError("Erè rezo — eseye ankò.");
    }
    setSaving(false);
  }

  async function handleReset(u: UserSummary) {
    if (!confirm(`${t("users_reset_confirm")}\n\n${u.fullName || u.email}`)) return;
    setBusyEmail(u.email);
    setError(null);
    setCred(null);
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(u.email)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_password" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Pa ka reyinisyalize modpas la.");
      } else {
        setCred({ kind: "reset", name: u.fullName || u.email, email: u.email, password: data.temporaryPassword });
        window.scrollTo({ top: 0, behavior: "smooth" });
        await load();
      }
    } catch {
      setError("Erè rezo — eseye ankò.");
    }
    setBusyEmail(null);
  }

  async function handleToggleActive(u: UserSummary) {
    const deactivating = !u.disabled;
    if (!confirm(`${t(deactivating ? "users_deactivate_confirm" : "users_activate_confirm")}\n\n${u.fullName || u.email}`)) return;
    setBusyEmail(u.email);
    setError(null);
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(u.email)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: deactivating ? "deactivate" : "activate" }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Erè — eseye ankò.");
      else await load();
    } catch {
      setError("Erè rezo — eseye ankò.");
    }
    setBusyEmail(null);
  }

  async function handleDelete(targetEmail: string) {
    if (!confirm(`Efase kont "${targetEmail}" nèt? Sa pa ka anile.`)) return;
    setBusyEmail(targetEmail);
    setError(null);
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(targetEmail)}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Pa ka efase kont lan.");
      else await load();
    } catch {
      setError("Erè rezo — eseye ankò.");
    }
    setBusyEmail(null);
  }

  async function copyCred() {
    if (!cred) return;
    try {
      await navigator.clipboard.writeText(cred.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt(t("users_temp_password"), cred.password);
    }
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
        <p className="text-sm text-ink/60 dark:text-paper/60">{t("users_forbidden")}</p>
      </main>
    );
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const waText = cred
    ? `Bonjou ${cred.name}, kont ou kreye.\nLyen: ${origin}/login\nImèl: ${cred.email}\nModpas tanporè: ${cred.password}\nOu pral chanje modpas la nan premye koneksyon an.`
    : "";

  return (
    <main className="max-w-3xl mx-auto px-4 lg:px-8 py-8 pb-24">
      <div className="flex items-end justify-between mb-5">
        <div>
          <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-forest mb-1">
            {users.length} {t("users_accounts_count")}
          </p>
          <h1 className="font-display text-2xl lg:text-3xl">{t("users_title")}</h1>
        </div>
        <button onClick={load} className="inline-flex items-center gap-1.5 text-sm font-semibold">
          <RefreshCw size={16} /> {t("users_refresh")}
        </button>
      </div>

      {error && <p className="text-sm text-brick mb-4">{error}</p>}

      {/* Modpas tanporè (parèt yon sèl fwa) */}
      {cred && (
        <div className="rounded-2xl border-2 border-forest/40 bg-forest/5 p-5 mb-5">
          <div className="flex items-center gap-2 text-forest font-semibold mb-3">
            <KeyRound size={18} />
            {cred.kind === "created" ? t("users_created_title") : t("users_reset_title")}
          </div>
          <p className="text-sm mb-0.5 font-medium">{cred.name}</p>
          <p className="text-xs text-ink/60 dark:text-paper/60 mb-3 break-all">{cred.email}</p>
          <p className={labelClass}>{t("users_temp_password")}</p>
          <div className="flex items-center gap-2 mb-3">
            <code className="flex-1 rounded-xl bg-white dark:bg-dark-surface border border-ink/10 dark:border-dark-border px-4 py-3 text-lg font-bold tracking-wider text-center select-all">
              {cred.password}
            </code>
            <button
              onClick={copyCred}
              aria-label={t("shop_copy")}
              className="rounded-xl border border-ink/15 dark:border-dark-border bg-white dark:bg-dark-surface px-3.5 py-3.5"
            >
              {copied ? <Check size={18} className="text-forest" /> : <Copy size={18} />}
            </button>
          </div>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(waText)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-forest text-paper px-4 py-2.5 text-sm font-medium mb-3"
          >
            <MessageCircle size={15} /> {t("shop_share_whatsapp")}
          </a>
          <p className="text-xs text-brick">{t("users_temp_once")}</p>
          <button onClick={() => setCred(null)} className="mt-3 text-xs underline underline-offset-2 text-ink/60 dark:text-paper/60">
            OK
          </button>
        </div>
      )}

      {/* Fòm kreyasyon */}
      <div className="rounded-2xl border border-ink/10 dark:border-dark-border bg-white dark:bg-dark-surface p-5 mb-6">
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-ink text-paper rounded-xl px-5 py-3 text-sm font-semibold"
          >
            <Plus size={16} /> {t("users_new")}
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className={labelClass}>{t("users_fullname")}</span>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={inputClass}
                placeholder="Jean Paul"
                minLength={2}
                required
                autoFocus
              />
            </label>
            <label className="block">
              <span className={labelClass}>{t("users_email")}</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="nom@egzanp.com"
                required
              />
            </label>
            <label className="block">
              <span className={labelClass}>{t("users_role")}</span>
              <select value={role} onChange={(e) => setRole(e.target.value as Role)} className={`${inputClass} sm:max-w-xs`}>
                <option value="gestionnaire">{t("users_role_manager")}</option>
                <option value="caissier">{t("users_role_cashier")}</option>
                <option value="admin">{t("users_role_admin")}</option>
              </select>
            </label>
            <p className="text-xs text-ink/55 dark:text-paper/55 flex gap-2">
              <KeyRound size={14} className="shrink-0 mt-0.5" /> {t("users_temp_hint")}
            </p>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 bg-ink text-paper rounded-xl px-5 py-3 text-sm font-semibold disabled:opacity-50"
              >
                <Plus size={16} /> {saving ? t("users_creating") : t("users_create")}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="text-sm text-ink/60 dark:text-paper/60">
                ✕
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Lis kont yo */}
      {users.length === 0 ? (
        <div className="text-center py-16 text-ink/40 dark:text-paper/40">
          <UserCog size={28} className="mx-auto mb-2" />
          <p className="text-sm">{t("users_empty")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => {
            const isSuper = u.email.toLowerCase() === SUPER_ADMIN_EMAIL;
            const canReset = !isSuper && !u.disabled && (u.role !== "admin" || isSuperAdmin);
            return (
              <div
                key={u.id}
                className={`rounded-2xl border border-ink/10 dark:border-dark-border bg-white dark:bg-dark-surface p-4 border-l-4 ${
                  u.disabled ? "border-l-brick opacity-70" : u.mustChangePassword ? "border-l-amber-500" : "border-l-forest"
                }`}
              >
                <p className="text-[15px]">
                  <span className="font-bold">{u.fullName || u.email}</span>
                  {u.fullName && <span className="text-ink/50 dark:text-paper/50 text-sm"> {u.email}</span>}
                  {isSuper && (
                    <span className="ml-2 text-[10px] uppercase tracking-wide text-gold-dark">{t("users_principal")}</span>
                  )}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                  <span
                    className={`rounded-full px-3 py-1 font-bold text-white ${
                      u.disabled ? "bg-brick" : u.mustChangePassword ? "bg-amber-500" : "bg-forest"
                    }`}
                  >
                    {u.disabled ? t("users_status_disabled") : u.mustChangePassword ? t("users_status_pending") : t("users_status_active")}
                  </span>
                  <span className="text-ink/55 dark:text-paper/55">
                    {t("users_last_login")}: {u.lastLoginAt ? fmtDate(u.lastLoginAt) : t("users_never_logged")}
                  </span>
                </div>
                <p className="text-xs text-ink/50 dark:text-paper/50 mt-2">
                  {ROLE_LABELS[u.role]} · {u.businessCount} {t("users_businesses_count")}
                </p>

                {(canReset || (isSuperAdmin && !isSuper)) && (
                  <div className="flex items-center gap-5 mt-3 pt-3 border-t border-ink/8 dark:border-dark-border/60">
                    {canReset && (
                      <button
                        onClick={() => handleReset(u)}
                        disabled={busyEmail === u.email}
                        className="text-sm font-semibold disabled:opacity-40"
                      >
                        {t("users_reset_password")}
                      </button>
                    )}
                    {isSuperAdmin && !isSuper && (
                      <button
                        onClick={() => handleToggleActive(u)}
                        disabled={busyEmail === u.email}
                        className={`text-sm font-semibold disabled:opacity-40 ${u.disabled ? "text-forest" : "text-brick"}`}
                      >
                        {u.disabled ? t("users_activate") : t("users_deactivate")}
                      </button>
                    )}
                    {isSuperAdmin && !isSuper && (
                      <button
                        onClick={() => handleDelete(u.email)}
                        disabled={busyEmail === u.email}
                        className="text-sm font-semibold text-brick inline-flex items-center gap-1 disabled:opacity-40"
                      >
                        <Trash2 size={14} /> {t("users_delete")}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
