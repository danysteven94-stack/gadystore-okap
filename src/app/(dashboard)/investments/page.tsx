"use client";

import { useCallback, useEffect, useState } from "react";
import { Landmark, Loader2, Plus, Pencil, Trash2, ArrowRightLeft, Banknote, Building, Boxes, TrendingUp, TrendingDown } from "lucide-react";
import { BusinessSwitcher } from "@/components/dashboard/business-switcher";
import { useLanguage } from "@/lib/i18n/language-provider";
import { tr } from "@/lib/i18n/tr";
import type { Business, CapitalSummary, Investment, InvestmentSource, Transfer } from "@/types";

type L = { ht: string; fr: string; en: string };

const SOURCES: { key: InvestmentSource; label: L }[] = [
  { key: "personal", label: { ht: "Pwòp lajan mwen", fr: "Fonds personnels", en: "Own funds" } },
  { key: "loan", label: { ht: "Prè", fr: "Prêt", en: "Loan" } },
  { key: "partner", label: { ht: "Asosye / patnè", fr: "Associé / partenaire", en: "Partner" } },
  { key: "other", label: { ht: "Lòt", fr: "Autre", en: "Other" } },
];

const T = {
  title: { ht: "Envestisman & Kapital", fr: "Investissements & Capital", en: "Investments & Capital" },
  all: { ht: "Kapital global (tout antrepriz)", fr: "Capital global (toutes les entreprises)", en: "Global capital (all businesses)" },
  capital: { ht: "Kapital total", fr: "Capital total", en: "Total capital" },
  capitalHint: { ht: "kes + labank + valè stok", fr: "caisse + banque + valeur du stock", en: "cash + bank + stock value" },
  cash: { ht: "Kòb nan kes", fr: "Argent en caisse", en: "Cash on hand" },
  bank: { ht: "Kòb labank", fr: "Argent en banque", en: "Money in bank" },
  stock: { ht: "Valè stok (pri acha)", fr: "Valeur du stock (prix d'achat)", en: "Stock value (cost)" },
  invested: { ht: "Total envesti", fr: "Total investi", en: "Total invested" },
  gain: { ht: "Gen / Pèt depi kòmansman", fr: "Gain / Perte depuis le début", en: "Gain / Loss since start" },
  bySource: { ht: "Kote kòb la soti", fr: "D'où vient l'argent", en: "Where the money came from" },
  perBusiness: { ht: "Pa antrepriz", fr: "Par entreprise", en: "By business" },
  addInv: { ht: "Ajoute yon envestisman", fr: "Ajouter un investissement", en: "Add an investment" },
  editInv: { ht: "Modifye envestisman an", fr: "Modifier l'investissement", en: "Edit investment" },
  amount: { ht: "Montan (G)", fr: "Montant (G)", en: "Amount (G)" },
  source: { ht: "Kote kòb la soti", fr: "Provenance", en: "Source" },
  sourceLabel: { ht: "Non / detay sou sous la (opsyonèl)", fr: "Nom / détail de la source (optionnel)", en: "Source name / detail (optional)" },
  sourceLabelPh: { ht: "ekz: Prè Sogebank, Jean...", fr: "ex : Prêt Sogebank, Jean...", en: "e.g. Bank loan, John..." },
  destination: { ht: "Kòb la antre nan", fr: "L'argent entre en", en: "Money goes into" },
  inCash: { ht: "Kes", fr: "Caisse", en: "Cash" },
  inBank: { ht: "Labank", fr: "Banque", en: "Bank" },
  date: { ht: "Dat", fr: "Date", en: "Date" },
  note: { ht: "Nòt (opsyonèl)", fr: "Note (optionnelle)", en: "Note (optional)" },
  save: { ht: "Anrejistre", fr: "Enregistrer", en: "Save" },
  saveChanges: { ht: "Sove chanjman yo", fr: "Enregistrer les modifications", en: "Save changes" },
  saving: { ht: "Ap anrejistre...", fr: "Enregistrement...", en: "Saving..." },
  cancel: { ht: "Anile", fr: "Annuler", en: "Cancel" },
  history: { ht: "Istorik envestisman", fr: "Historique des investissements", en: "Investment history" },
  empty: { ht: "Poko gen envestisman. Ajoute premye a pou kòmanse swiv kes ak labank.", fr: "Aucun investissement. Ajoutez le premier pour commencer le suivi caisse/banque.", en: "No investments yet. Add the first one to start tracking cash/bank." },
  transfer: { ht: "Transfè kes ↔ labank", fr: "Transfert caisse ↔ banque", en: "Cash ↔ bank transfer" },
  toBank: { ht: "Kes → Labank (depo)", fr: "Caisse → Banque (dépôt)", en: "Cash → Bank (deposit)" },
  toCash: { ht: "Labank → Kes (retrè)", fr: "Banque → Caisse (retrait)", en: "Bank → Cash (withdrawal)" },
  doTransfer: { ht: "Fè transfè a", fr: "Effectuer le transfert", en: "Make transfer" },
  confirmDel: { ht: "Efase sa a? Kapital la ap rekalkile.", fr: "Supprimer ceci ? Le capital sera recalculé.", en: "Delete this? Capital will be recalculated." },
  tracking: { ht: "Swivi kes/labank kòmanse", fr: "Suivi caisse/banque depuis le", en: "Cash/bank tracked since" },
  trackingHint: { ht: "Vant, depans ak retou anvan dat sa a pa konte.", fr: "Les ventes, dépenses et retours avant cette date ne comptent pas.", en: "Sales, expenses and returns before this date are not counted." },
  noTracking: { ht: "Ajoute premye envestisman an (kòb ou te mete nan kes/labank pou kòmanse) pou kapital la kòmanse kalkile.", fr: "Ajoutez le premier investissement (l'argent de départ en caisse/banque) pour démarrer le calcul du capital.", en: "Add the first investment (your starting money in cash/bank) to start the capital calculation." },
  truncated: { ht: "Istorik la twò long: sèlman dènye 3 an yo konte.", fr: "Historique trop long : seuls les 3 derniers ans sont comptés.", en: "History too long: only the last 3 years are counted." },
  forbidden: { ht: "Sèlman admin ka wè paj sa a.", fr: "Seul l'administrateur peut voir cette page.", en: "Only admins can view this page." },
  loadError: { ht: "Pa ka chaje done yo. Eseye ankò.", fr: "Impossible de charger les données. Réessayez.", en: "Could not load data. Try again." },
  needBusiness: { ht: "Kreye yon antrepriz anvan.", fr: "Créez d'abord une entreprise.", en: "Create a business first." },
  noTransfers: { ht: "Pa gen transfè.", fr: "Aucun transfert.", en: "No transfers." },
} satisfies Record<string, L>;

const fmt = (n: number) => `${Math.round(Number(n)).toLocaleString("fr-FR")} G`;
const todayStr = () => new Date().toISOString().slice(0, 10);
const inputCls =
  "w-full border border-ink/15 dark:border-dark-border bg-white dark:bg-dark-surface rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brick/30";
const cardCls = "rounded-card border border-line dark:border-dark-border bg-white dark:bg-dark-surface shadow-card dark:shadow-none";

type GlobalCapital = { businesses: CapitalSummary[]; total: Omit<CapitalSummary, "businessId" | "name" | "trackingStart" | "truncated"> };

function Metric({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: string; tone?: "good" | "bad" }) {
  return (
    <div className={`${cardCls} p-3.5`}>
      <p className="flex items-center gap-1.5 text-xs text-ink/55 dark:text-white/55 mb-1">
        <Icon size={13} /> {label}
      </p>
      <p className={`stat-figure text-lg font-semibold ${tone === "good" ? "text-emerald-600" : tone === "bad" ? "text-brick" : ""}`}>{value}</p>
    </div>
  );
}

function Summary({ c, lang }: { c: Pick<CapitalSummary, "capital" | "cash" | "bank" | "stockValue" | "invested" | "gain" | "investedBySource">; lang: "ht" | "fr" | "en" }) {
  return (
    <>
      <div className="rounded-card p-5 mb-3 bg-ink dark:bg-dark-surface text-paper">
        <p className="text-xs uppercase tracking-wide text-white/50 mb-1">{tr(lang, T.capital)}</p>
        <p className="font-display font-semibold text-3xl">{fmt(c.capital)}</p>
        <p className="text-xs text-white/50 mt-1">{tr(lang, T.capitalHint)}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <Metric icon={Banknote} label={tr(lang, T.cash)} value={fmt(c.cash)} tone={c.cash < 0 ? "bad" : undefined} />
        <Metric icon={Building} label={tr(lang, T.bank)} value={fmt(c.bank)} tone={c.bank < 0 ? "bad" : undefined} />
        <Metric icon={Boxes} label={tr(lang, T.stock)} value={fmt(c.stockValue)} />
        <Metric icon={Landmark} label={tr(lang, T.invested)} value={fmt(c.invested)} />
        <div className="col-span-2">
          <Metric
            icon={c.gain >= 0 ? TrendingUp : TrendingDown}
            label={tr(lang, T.gain)}
            value={`${c.gain > 0 ? "+" : ""}${fmt(c.gain)}`}
            tone={c.gain > 0 ? "good" : c.gain < 0 ? "bad" : undefined}
          />
        </div>
      </div>
      {c.invested > 0 && (
        <div className={`${cardCls} p-4 mb-5`}>
          <p className="text-xs font-medium text-ink/55 dark:text-white/55 mb-2">{tr(lang, T.bySource)}</p>
          <div className="space-y-1.5">
            {SOURCES.filter((s) => c.investedBySource[s.key] > 0).map((s) => (
              <div key={s.key} className="flex justify-between text-sm">
                <span>{tr(lang, s.label)}</span>
                <span className="stat-figure font-medium">{fmt(c.investedBySource[s.key])}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export default function InvestmentsPage() {
  const { lang } = useLanguage();
  const [businesses, setBusinesses] = useState<Business[] | null>(null);
  const [activeId, setActiveId] = useState("all");
  const [global, setGlobal] = useState<GlobalCapital | null>(null);
  const [capital, setCapital] = useState<CapitalSummary | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // fòm envestisman
  const [showInv, setShowInv] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [amount, setAmount] = useState(0);
  const [source, setSource] = useState<InvestmentSource>("personal");
  const [sourceLabel, setSourceLabel] = useState("");
  const [destination, setDestination] = useState<"cash" | "bank">("cash");
  const [date, setDate] = useState(todayStr());
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  // fòm transfè
  const [trDirection, setTrDirection] = useState<"cash_to_bank" | "bank_to_cash">("cash_to_bank");
  const [trAmount, setTrAmount] = useState(0);
  const [trNote, setTrNote] = useState("");
  const [trSaving, setTrSaving] = useState(false);

  useEffect(() => {
    fetch("/api/businesses")
      .then((r) => r.json())
      .then((d) => setBusinesses(d.businesses ?? []))
      .catch(() => setBusinesses([]));
  }, []);

  const load = useCallback(async () => {
    if (!businesses || businesses.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      if (activeId === "all") {
        const res = await fetch("/api/capital");
        if (res.status === 403) return setForbidden(true);
        if (!res.ok) throw new Error();
        setGlobal(await res.json());
      } else {
        const [c, i, t] = await Promise.all([
          fetch(`/api/capital?businessId=${activeId}`),
          fetch(`/api/investments?businessId=${activeId}`),
          fetch(`/api/transfers?businessId=${activeId}`),
        ]);
        if ([c, i, t].some((r) => r.status === 403)) return setForbidden(true);
        if (!c.ok || !i.ok || !t.ok) throw new Error();
        setCapital((await c.json()).capital);
        setInvestments((await i.json()).investments ?? []);
        setTransfers((await t.json()).transfers ?? []);
      }
    } catch {
      setError(tr(lang, T.loadError));
    } finally {
      setLoading(false);
    }
  }, [activeId, businesses, lang]);

  useEffect(() => {
    load();
  }, [load]);

  function resetInvForm() {
    setShowInv(false);
    setEditingId(null);
    setAmount(0);
    setSource("personal");
    setSourceLabel("");
    setDestination("cash");
    setDate(todayStr());
    setNote("");
  }

  function startEdit(inv: Investment) {
    setEditingId(inv.id);
    setAmount(Number(inv.amount));
    setSource(inv.source);
    setSourceLabel(inv.sourceLabel ?? "");
    setDestination(inv.destination);
    setDate(inv.date);
    setNote(inv.note ?? "");
    setShowInv(true);
  }

  async function submitInvestment(e: React.FormEvent) {
    e.preventDefault();
    if (activeId === "all" || amount <= 0) return;
    setSaving(true);
    setError(null);
    try {
      const body = { amount, source, sourceLabel, destination, date, note };
      const res = editingId
        ? await fetch(`/api/investments/${editingId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        : await fetch("/api/investments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, businessId: activeId }) });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(typeof d.error === "string" ? d.error : tr(lang, T.loadError));
      } else {
        resetInvForm();
        await load();
      }
    } catch {
      setError(tr(lang, T.loadError));
    }
    setSaving(false);
  }

  async function remove(url: string) {
    if (!window.confirm(tr(lang, T.confirmDel))) return;
    setError(null);
    try {
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error();
      await load();
    } catch {
      setError(tr(lang, T.loadError));
    }
  }

  async function submitTransfer(e: React.FormEvent) {
    e.preventDefault();
    if (activeId === "all" || trAmount <= 0) return;
    setTrSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: activeId, direction: trDirection, amount: trAmount, note: trNote }),
      });
      if (!res.ok) throw new Error();
      setTrAmount(0);
      setTrNote("");
      await load();
    } catch {
      setError(tr(lang, T.loadError));
    }
    setTrSaving(false);
  }

  if (businesses === null) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 flex justify-center text-ink/40 dark:text-white/40">
        <Loader2 size={24} className="animate-spin" />
      </main>
    );
  }
  if (businesses.length === 0) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 text-center">
        <Landmark size={28} className="mx-auto mb-3 text-ink/30" />
        <p className="text-sm text-ink/60 dark:text-white/60">{tr(lang, T.needBusiness)}</p>
      </main>
    );
  }
  if (forbidden) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 text-center">
        <Landmark size={28} className="mx-auto mb-3 text-ink/30" />
        <p className="text-sm text-ink/60 dark:text-white/60">{tr(lang, T.forbidden)}</p>
      </main>
    );
  }

  const sourceName = (s: InvestmentSource) => tr(lang, SOURCES.find((x) => x.key === s)!.label);

  return (
    <main className="max-w-3xl mx-auto px-4 lg:px-8 py-8 pb-24">
      <h1 className="font-display font-semibold text-xl lg:text-2xl mb-4">{tr(lang, T.title)}</h1>

      <BusinessSwitcher
        businesses={businesses.map((b) => ({ id: b.id, name: b.name, icon: b.icon }))}
        activeId={activeId}
        onSelect={(id) => {
          resetInvForm();
          setActiveId(id);
        }}
      />

      {error && <p className="text-sm text-brick text-center mt-4">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-16 text-ink/40 dark:text-white/40">
          <Loader2 size={24} className="animate-spin" />
        </div>
      ) : activeId === "all" ? (
        global && (
          <div className="mt-5">
            <p className="text-sm font-semibold text-ink/70 dark:text-white/70 mb-2">{tr(lang, T.all)}</p>
            <Summary c={global.total} lang={lang} />
            <p className="text-sm font-semibold text-ink/70 dark:text-white/70 mb-2">{tr(lang, T.perBusiness)}</p>
            <div className="space-y-3">
              {global.businesses.map((b) => (
                <button
                  key={b.businessId}
                  onClick={() => setActiveId(b.businessId)}
                  className={`${cardCls} w-full text-left p-4 hover:border-ink dark:hover:border-white transition-colors`}
                >
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="font-semibold">{b.name}</span>
                    <span className="stat-figure font-semibold">{fmt(b.capital)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-ink/60 dark:text-white/60">
                    <span>{tr(lang, T.cash)}: <b className="stat-figure text-ink dark:text-white">{fmt(b.cash)}</b></span>
                    <span>{tr(lang, T.bank)}: <b className="stat-figure text-ink dark:text-white">{fmt(b.bank)}</b></span>
                    <span>{tr(lang, T.stock)}: <b className="stat-figure text-ink dark:text-white">{fmt(b.stockValue)}</b></span>
                    <span>{tr(lang, T.invested)}: <b className="stat-figure text-ink dark:text-white">{fmt(b.invested)}</b></span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )
      ) : (
        capital && (
          <div className="mt-5">
            <Summary c={capital} lang={lang} />

            <p className="text-xs text-ink/55 dark:text-white/55 mb-5">
              {capital.trackingStart ? (
                <>
                  {tr(lang, T.tracking)} <b>{capital.trackingStart}</b>. {tr(lang, T.trackingHint)}
                </>
              ) : (
                tr(lang, T.noTracking)
              )}
              {capital.truncated && <span className="block text-brick mt-1">{tr(lang, T.truncated)}</span>}
            </p>

            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">{tr(lang, T.history)}</h2>
              <button
                onClick={() => (showInv && !editingId ? resetInvForm() : (resetInvForm(), setShowInv(true)))}
                className="inline-flex items-center gap-2 bg-brick hover:bg-brick-dark text-white rounded-md px-3.5 py-2 text-sm font-medium"
              >
                <Plus size={15} /> {tr(lang, T.addInv)}
              </button>
            </div>

            {showInv && (
              <form onSubmit={submitInvestment} className={`${cardCls} p-5 mb-4 space-y-4`}>
                {editingId && <p className="text-sm font-semibold">{tr(lang, T.editInv)}</p>}
                <label className="block">
                  <span className="block text-xs font-medium text-ink/70 dark:text-white/70 mb-1">{tr(lang, T.amount)}</span>
                  <input type="number" min={1} value={amount || ""} onChange={(e) => setAmount(Number(e.target.value))} className={inputCls} required />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="block text-xs font-medium text-ink/70 dark:text-white/70 mb-1">{tr(lang, T.source)}</span>
                    <select value={source} onChange={(e) => setSource(e.target.value as InvestmentSource)} className={inputCls}>
                      {SOURCES.map((s) => (
                        <option key={s.key} value={s.key}>{tr(lang, s.label)}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="block text-xs font-medium text-ink/70 dark:text-white/70 mb-1">{tr(lang, T.destination)}</span>
                    <select value={destination} onChange={(e) => setDestination(e.target.value as "cash" | "bank")} className={inputCls}>
                      <option value="cash">{tr(lang, T.inCash)}</option>
                      <option value="bank">{tr(lang, T.inBank)}</option>
                    </select>
                  </label>
                </div>
                <label className="block">
                  <span className="block text-xs font-medium text-ink/70 dark:text-white/70 mb-1">{tr(lang, T.sourceLabel)}</span>
                  <input value={sourceLabel} onChange={(e) => setSourceLabel(e.target.value)} placeholder={tr(lang, T.sourceLabelPh)} maxLength={120} className={inputCls} />
                </label>
                <label className="block">
                  <span className="block text-xs font-medium text-ink/70 dark:text-white/70 mb-1">{tr(lang, T.date)}</span>
                  <input type="date" value={date} max={todayStr()} onChange={(e) => e.target.value && setDate(e.target.value)} className={inputCls} />
                </label>
                <label className="block">
                  <span className="block text-xs font-medium text-ink/70 dark:text-white/70 mb-1">{tr(lang, T.note)}</span>
                  <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} className={inputCls} />
                </label>
                <div className="flex gap-2">
                  {editingId && (
                    <button type="button" onClick={resetInvForm} className="flex-1 border border-ink/15 dark:border-dark-border rounded-md py-2.5 text-sm font-medium">
                      {tr(lang, T.cancel)}
                    </button>
                  )}
                  <button type="submit" disabled={saving} className="flex-1 bg-brick hover:bg-brick-dark text-white rounded-md py-2.5 text-sm font-medium disabled:opacity-50">
                    {saving ? tr(lang, T.saving) : editingId ? tr(lang, T.saveChanges) : tr(lang, T.save)}
                  </button>
                </div>
              </form>
            )}

            {investments.length === 0 ? (
              <p className="text-sm text-center text-ink/40 dark:text-white/40 py-8">{tr(lang, T.empty)}</p>
            ) : (
              <div className={`${cardCls} overflow-hidden mb-8`}>
                {investments.map((inv, i) => (
                  <div key={inv.id} className={`flex items-center justify-between gap-3 px-4 py-3 text-sm ${i > 0 ? "border-t border-ink/8 dark:border-dark-border/60" : ""}`}>
                    <span className="min-w-0">
                      <span className="font-medium">{inv.sourceLabel || sourceName(inv.source)}</span>
                      <span className="ml-2 text-[11px] rounded-full bg-mist dark:bg-white/10 px-2 py-0.5 text-ink/60 dark:text-white/60">
                        {sourceName(inv.source)} → {inv.destination === "bank" ? tr(lang, T.inBank) : tr(lang, T.inCash)}
                      </span>
                      <span className="block text-xs text-ink/40 dark:text-white/40 truncate">
                        {inv.date}{inv.note ? ` · ${inv.note}` : ""}
                      </span>
                    </span>
                    <span className="flex items-center gap-1 shrink-0">
                      <span className="stat-figure font-medium mr-1">{fmt(inv.amount)}</span>
                      <button type="button" onClick={() => startEdit(inv)} aria-label="Edit" className="p-1.5 rounded hover:bg-mist dark:hover:bg-white/10 text-ink/60 dark:text-white/60">
                        <Pencil size={15} />
                      </button>
                      <button type="button" onClick={() => remove(`/api/investments/${inv.id}`)} aria-label="Delete" className="p-1.5 rounded hover:bg-brick/10 text-brick">
                        <Trash2 size={15} />
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            )}

            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <ArrowRightLeft size={16} /> {tr(lang, T.transfer)}
            </h2>
            <form onSubmit={submitTransfer} className={`${cardCls} p-5 mb-4 space-y-4`}>
              <div className="grid grid-cols-2 gap-3">
                <select value={trDirection} onChange={(e) => setTrDirection(e.target.value as "cash_to_bank" | "bank_to_cash")} className={inputCls}>
                  <option value="cash_to_bank">{tr(lang, T.toBank)}</option>
                  <option value="bank_to_cash">{tr(lang, T.toCash)}</option>
                </select>
                <input type="number" min={1} value={trAmount || ""} onChange={(e) => setTrAmount(Number(e.target.value))} placeholder={tr(lang, T.amount)} className={inputCls} required />
              </div>
              <input value={trNote} onChange={(e) => setTrNote(e.target.value)} placeholder={tr(lang, T.note)} maxLength={500} className={inputCls} />
              <button type="submit" disabled={trSaving} className="w-full bg-ink text-paper dark:bg-white dark:text-ink rounded-md py-2.5 text-sm font-medium disabled:opacity-50">
                {trSaving ? tr(lang, T.saving) : tr(lang, T.doTransfer)}
              </button>
            </form>
            {transfers.length === 0 ? (
              <p className="text-sm text-center text-ink/40 dark:text-white/40 py-4">{tr(lang, T.noTransfers)}</p>
            ) : (
              <div className={`${cardCls} overflow-hidden`}>
                {transfers.map((t, i) => (
                  <div key={t.id} className={`flex items-center justify-between gap-3 px-4 py-3 text-sm ${i > 0 ? "border-t border-ink/8 dark:border-dark-border/60" : ""}`}>
                    <span className="min-w-0">
                      {t.direction === "cash_to_bank" ? tr(lang, T.toBank) : tr(lang, T.toCash)}
                      <span className="block text-xs text-ink/40 dark:text-white/40 truncate">{t.date}{t.note ? ` · ${t.note}` : ""}</span>
                    </span>
                    <span className="flex items-center gap-1 shrink-0">
                      <span className="stat-figure font-medium mr-1">{fmt(t.amount)}</span>
                      <button type="button" onClick={() => remove(`/api/transfers/${t.id}`)} aria-label="Delete" className="p-1.5 rounded hover:bg-brick/10 text-brick">
                        <Trash2 size={15} />
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      )}
    </main>
  );
}
