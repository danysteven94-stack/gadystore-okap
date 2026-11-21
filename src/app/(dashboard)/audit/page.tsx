"use client";

import { useCallback, useEffect, useState } from "react";
import { ScrollText, Loader2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-provider";
import { tr } from "@/lib/i18n/tr";
import { useSuperInfo } from "@/lib/use-super-info";
import type { AuditAction, AuditEntry } from "@/lib/audit-core";
import type { Business } from "@/types";

type L = { ht: string; fr: string; en: string };

const LABELS: Record<AuditAction, L> = {
  "auth.login": { ht: "Koneksyon", fr: "Connexion", en: "Login" },
  "auth.login_failed": { ht: "Koneksyon echwe", fr: "Connexion échouée", en: "Failed login" },
  "auth.password_changed": { ht: "Modpas chanje", fr: "Mot de passe changé", en: "Password changed" },
  "auth.password_reset": { ht: "Modpas reyinisyalize (imèl)", fr: "Mot de passe réinitialisé (e-mail)", en: "Password reset (email)" },
  "auth.2fa_enabled": { ht: "2FA aktive", fr: "2FA activée", en: "2FA enabled" },
  "auth.2fa_disabled": { ht: "2FA dezaktive", fr: "2FA désactivée", en: "2FA disabled" },
  "user.create": { ht: "Itilizatè kreye", fr: "Utilisateur créé", en: "User created" },
  "user.delete": { ht: "Itilizatè efase", fr: "Utilisateur supprimé", en: "User deleted" },
  "user.deactivate": { ht: "Kont dezaktive", fr: "Compte désactivé", en: "Account deactivated" },
  "user.activate": { ht: "Kont reaktive", fr: "Compte réactivé", en: "Account reactivated" },
  "user.reset_password": { ht: "Modpas reyinisyalize (admin)", fr: "Mot de passe réinitialisé (admin)", en: "Password reset (admin)" },
  "user.set_businesses": { ht: "Biznis itilizatè chanje", fr: "Entreprises de l'utilisateur modifiées", en: "User businesses changed" },
  "user.set_plan": { ht: "Plan chanje", fr: "Plan modifié", en: "Plan changed" },
  "product.create": { ht: "Pwodwi kreye", fr: "Produit créé", en: "Product created" },
  "product.update": { ht: "Pwodwi modifye", fr: "Produit modifié", en: "Product updated" },
  "product.delete": { ht: "Pwodwi efase", fr: "Produit supprimé", en: "Product deleted" },
  "inventory.adjust": { ht: "Stok ajiste (envantè)", fr: "Stock ajusté (inventaire)", en: "Stock adjusted (count)" },
  "return.create": { ht: "Retou", fr: "Retour", en: "Return" },
  "expense.update": { ht: "Depans modifye", fr: "Dépense modifiée", en: "Expense updated" },
  "expense.delete": { ht: "Depans efase", fr: "Dépense supprimée", en: "Expense deleted" },
  "investment.create": { ht: "Envestisman ajoute", fr: "Investissement ajouté", en: "Investment added" },
  "investment.update": { ht: "Envestisman modifye", fr: "Investissement modifié", en: "Investment updated" },
  "investment.delete": { ht: "Envestisman efase", fr: "Investissement supprimé", en: "Investment deleted" },
  "transfer.create": { ht: "Transfè kes/labank", fr: "Transfert caisse/banque", en: "Cash/bank transfer" },
  "transfer.delete": { ht: "Transfè efase", fr: "Transfert supprimé", en: "Transfer deleted" },
  "order.cancel": { ht: "Kòmand anile", fr: "Commande annulée", en: "Order cancelled" },
  "order.fulfillment": { ht: "Etap kòmand chanje", fr: "Étape de commande modifiée", en: "Order stage changed" },
  "order.payment": { ht: "Peman kòmand", fr: "Paiement de commande", en: "Order payment" },
  "backup.restore": { ht: "Backup restore", fr: "Restauration de sauvegarde", en: "Backup restored" },
  "billing.pay": { ht: "Peman abònman itilizatè", fr: "Paiement d'abonnement utilisateur", en: "User subscription payment" },
  "billing.undo": { ht: "Peman abònman anile", fr: "Paiement d'abonnement annulé", en: "User subscription payment undone" },
  "billing.set_price": { ht: "Pri abònman chanje", fr: "Prix d'abonnement modifié", en: "Subscription price changed" },
};

const GROUPS: { value: string; label: L }[] = [
  { value: "", label: { ht: "Tout aksyon", fr: "Toutes les actions", en: "All actions" } },
  { value: "auth.", label: { ht: "Koneksyon / sekirite", fr: "Connexion / sécurité", en: "Login / security" } },
  { value: "user.", label: { ht: "Itilizatè", fr: "Utilisateurs", en: "Users" } },
  { value: "product.", label: { ht: "Pwodwi", fr: "Produits", en: "Products" } },
  { value: "order.", label: { ht: "Kòmand", fr: "Commandes", en: "Orders" } },
  { value: "inventory.", label: { ht: "Envantè", fr: "Inventaire", en: "Inventory" } },
  { value: "return.", label: { ht: "Retou", fr: "Retours", en: "Returns" } },
  { value: "expense.", label: { ht: "Depans", fr: "Dépenses", en: "Expenses" } },
  { value: "investment.", label: { ht: "Envestisman", fr: "Investissements", en: "Investments" } },
  { value: "transfer.", label: { ht: "Transfè kes/labank", fr: "Transferts caisse/banque", en: "Cash/bank transfers" } },
  { value: "billing.", label: { ht: "Abònman itilizatè", fr: "Abonnements utilisateurs", en: "User subscriptions" } },
  { value: "backup.", label: { ht: "Backup", fr: "Sauvegardes", en: "Backups" } },
];

const DANGER = new Set<string>(["auth.login_failed", "user.delete", "user.deactivate", "product.delete", "expense.delete", "investment.delete", "transfer.delete", "order.cancel", "backup.restore", "auth.2fa_disabled", "user.reset_password", "billing.undo"]);

function fmtVal(v: unknown): string {
  if (v === null || v === undefined) return "—";
  return typeof v === "object" ? JSON.stringify(v) : String(v);
}

function summarize(meta: Record<string, unknown> | undefined): string[] {
  if (!meta) return [];
  const lines: string[] = [];
  const changes = meta.changes as Record<string, { from: unknown; to: unknown }> | undefined;
  if (changes) for (const [k, c] of Object.entries(changes)) lines.push(`${k}: ${fmtVal(c.from)} → ${fmtVal(c.to)}`);
  for (const [k, v] of Object.entries(meta)) {
    if (k === "changes") continue;
    if (k === "items" && Array.isArray(v)) {
      for (const it of v as { name?: string; from?: unknown; to?: unknown }[]) lines.push(`${it.name ?? "?"}: ${fmtVal(it.from)} → ${fmtVal(it.to)}`);
    } else lines.push(`${k}: ${fmtVal(v)}`);
  }
  return lines.slice(0, 12);
}

export default function AuditPage() {
  const { lang } = useLanguage();
  const { isSuper, ready } = useSuperInfo();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [scope, setScope] = useState<string>("__init__"); // "" = global (kont prensipal la)
  const [action, setAction] = useState("");
  const [actor, setActor] = useState("");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/businesses").then((r) => r.json()).then((d) => setBusinesses(d.businesses ?? [])).catch(() => {});
  }, []);

  // Chwa pa defo: kont prensipal → global; lòt → premye biznis la.
  useEffect(() => {
    if (scope !== "__init__" || !ready) return; // tann nou konnen si se kont prensipal la
    if (isSuper) setScope("");
    else if (businesses.length) setScope(businesses[0].id);
  }, [scope, isSuper, ready, businesses]);

  const buildUrl = useCallback(
    (offset: number) => {
      const p = new URLSearchParams();
      if (scope) p.set("businessId", scope);
      if (action) p.set("action", action);
      if (actor.trim()) p.set("actor", actor.trim());
      if (q.trim()) p.set("q", q.trim());
      if (from) p.set("from", from);
      if (to) p.set("to", to);
      p.set("limit", "50");
      p.set("offset", String(offset));
      return `/api/audit?${p.toString()}`;
    },
    [scope, action, actor, q, from, to]
  );

  const load = useCallback(async () => {
    if (scope === "__init__") return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(buildUrl(0));
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Erè (kòd ${res.status}).`);
        setEntries([]);
        setNextOffset(null);
      } else {
        setEntries(data.entries ?? []);
        setNextOffset(typeof data.nextOffset === "number" ? data.nextOffset : null);
        setTotal(data.total ?? 0);
      }
    } catch {
      setError("Erè rezo — eseye ankò.");
    }
    setLoading(false);
  }, [scope, buildUrl]);

  useEffect(() => {
    const t = setTimeout(load, 250); // ti reta pandan itilizatè a ap tape
    return () => clearTimeout(t);
  }, [load]);

  async function loadMore() {
    if (nextOffset === null) return;
    setLoading(true);
    try {
      const res = await fetch(buildUrl(nextOffset));
      const data = await res.json();
      if (res.ok) {
        setEntries((prev) => [...prev, ...(data.entries ?? [])]);
        setNextOffset(typeof data.nextOffset === "number" ? data.nextOffset : null);
      }
    } catch {
      /* rete sou lis aktyèl la */
    }
    setLoading(false);
  }

  const input = "border border-ink/15 dark:border-dark-border rounded px-3 py-2 text-sm bg-white dark:bg-dark-surface focus:outline-none focus:ring-2 focus:ring-forest/30";

  return (
    <main className="max-w-3xl mx-auto px-4 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-forest/10 text-forest flex items-center justify-center"><ScrollText size={20} /></div>
        <div>
          <h1 className="font-display text-2xl leading-tight">{tr(lang, { ht: "Jounal odit", fr: "Journal d'audit", en: "Audit log" })}</h1>
          <p className="text-sm text-ink/60 dark:text-paper/60">
            {tr(lang, { ht: "Kilès ki fè kisa, ki lè.", fr: "Qui a fait quoi, et quand.", en: "Who did what, and when." })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <select aria-label="Biznis" className={`${input} col-span-2`} value={scope === "__init__" ? "" : scope} onChange={(e) => setScope(e.target.value)}>
          {isSuper && <option value="">{tr(lang, { ht: "Global (tout sistèm)", fr: "Global (tout le système)", en: "Global (whole system)" })}</option>}
          {businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select aria-label="Aksyon" className={input} value={action} onChange={(e) => setAction(e.target.value)}>
          {GROUPS.map((g) => <option key={g.value} value={g.value}>{tr(lang, g.label)}</option>)}
        </select>
        <input aria-label="Itilizatè" className={input} placeholder={tr(lang, { ht: "Itilizatè (imèl)", fr: "Utilisateur (e-mail)", en: "User (email)" })} value={actor} onChange={(e) => setActor(e.target.value)} />
        <input aria-label="Rechèch" className={`${input} col-span-2`} placeholder={tr(lang, { ht: "Chèche (non pwodwi, IP...)", fr: "Rechercher (produit, IP...)", en: "Search (product, IP...)" })} value={q} onChange={(e) => setQ(e.target.value)} />
        <input aria-label="De" type="date" className={input} value={from} onChange={(e) => setFrom(e.target.value)} />
        <input aria-label="Jiska" type="date" className={input} value={to} onChange={(e) => setTo(e.target.value)} />
      </div>

      {error && <p className="text-sm text-brick mb-4" role="alert">{error}</p>}

      {loading && entries.length === 0 ? (
        <p className="text-center py-10"><Loader2 className="inline animate-spin" size={18} /></p>
      ) : entries.length === 0 && !error ? (
        <p className="text-sm text-center text-ink/40 dark:text-white/40 py-10">
          {tr(lang, { ht: "Pa gen antre.", fr: "Aucune entrée.", en: "No entries." })}
        </p>
      ) : (
        <>
          <p className="text-xs text-ink/50 dark:text-paper/50 mb-2">{total} {tr(lang, { ht: "antre", fr: "entrées", en: "entries" })}</p>
          <ul className="space-y-2">
            {entries.map((e) => {
              const lines = summarize(e.meta);
              return (
                <li key={e.id} className="rounded-card border border-ink/10 dark:border-dark-border bg-white dark:bg-dark-surface p-3 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <span className={`font-medium ${DANGER.has(e.action) ? "text-brick" : ""}`}>{LABELS[e.action] ? tr(lang, LABELS[e.action]) : e.action}</span>
                    <time className="text-xs text-ink/50 dark:text-paper/50 shrink-0" dateTime={e.at}>{new Date(e.at).toLocaleString("fr-FR")}</time>
                  </div>
                  <p className="text-xs text-ink/70 dark:text-paper/70 mt-0.5 break-all">
                    {e.actor}{e.role ? ` (${e.role})` : ""}{e.target?.label ? ` → ${e.target.label}` : e.target?.id ? ` → ${e.target.type} ${e.target.id.slice(0, 8)}` : ""}
                  </p>
                  {lines.length > 0 && (
                    <ul className="mt-1.5 text-xs font-mono text-ink/60 dark:text-paper/60 space-y-0.5 break-words">
                      {lines.map((l, i) => <li key={i}>{l}</li>)}
                    </ul>
                  )}
                  {e.ip && <p className="text-[11px] text-ink/40 dark:text-paper/40 mt-1">IP {e.ip}</p>}
                </li>
              );
            })}
          </ul>
          {nextOffset !== null && (
            <button onClick={loadMore} disabled={loading} className="w-full mt-3 rounded-card border border-ink/15 dark:border-dark-border py-2.5 text-sm font-medium disabled:opacity-60">
              {loading ? "…" : "Chaje plis · Charger plus · Load more"}
            </button>
          )}
        </>
      )}
    </main>
  );
}
