"use client";

import { useMemo, useState } from "react";
import { Search, Plus, Users, Phone, Receipt } from "lucide-react";
import { BusinessSwitcher } from "@/components/dashboard/business-switcher";
import { ContactForm, type ContactFormValues } from "@/components/contacts/contact-form";

const BUSINESSES = [
  { id: "wholesale", name: "Gwo & Detay", icon: "warehouse" },
  { id: "import", name: "Enpòtasyon Pwodwi", icon: "ship" },
  { id: "food", name: "Manje, Patisri & Gato", icon: "cake" },
  { id: "electronics", name: "Pwodwi Elektwonik", icon: "smartphone" },
  { id: "streaming", name: "Pwodwi Streaming", icon: "streaming" },
];

interface Contact extends ContactFormValues {
  id: string;
  businessId: string;
  totalAmount: number; // total faktire (kliyan) oswa total achte (founisè)
  lastActivity: string;
  history: { label: string; amount: string; date: string }[];
}

// Données de démonstration — à remplacer par un fetch de /api/customers|/api/suppliers
const INITIAL_CUSTOMERS: Contact[] = [
  { id: "c1", businessId: "wholesale", name: "Rev. Ti Djo Boutik", phone: "3712-4501", email: "", address: "Kafou", totalAmount: 42500, lastActivity: "Jodi a", history: [
    { label: "Fakti #A102", amount: "8 500 G", date: "27 Out" },
    { label: "Fakti #A088", amount: "6 200 G", date: "20 Out" },
  ] },
  { id: "c2", businessId: "wholesale", name: "Manmi Rose", phone: "3498-2210", email: "", address: "Delmas 31", totalAmount: 9800, lastActivity: "Yè", history: [
    { label: "Fakti #A099", amount: "2 400 G", date: "26 Out" },
  ] },
  { id: "c3", businessId: "food", name: "Kafeterya Lakou", phone: "3611-7788", email: "", address: "Petyonvil", totalAmount: 15400, lastActivity: "3 jou pase", history: [
    { label: "Fakti #F045", amount: "480 G", date: "24 Out" },
  ] },
];

const INITIAL_SUPPLIERS: Contact[] = [
  { id: "s1", businessId: "wholesale", name: "Distribisyon Nò S.A.", phone: "2222-3344", email: "kontak@distribno.ht", address: "Okap", totalAmount: 128000, lastActivity: "5 jou pase", history: [
    { label: "Acha #P021 — diri, luil", amount: "45 000 G", date: "22 Out" },
    { label: "Acha #P015 — konsèv", amount: "18 500 G", date: "10 Out" },
  ] },
  { id: "s2", businessId: "import", name: "Global Import Co.", phone: "+1 305-555-0134", email: "sales@globalimport.com", address: "Miami, FL", totalAmount: 210000, lastActivity: "2 semèn pase", history: [
    { label: "Acha #P009 — kontenè", amount: "180 000 G", date: "12 Out" },
  ] },
  { id: "s3", businessId: "electronics", name: "TechWholesale HT", phone: "3755-9012", email: "", address: "Pòtoprens", totalAmount: 33000, lastActivity: "Semèn pase", history: [
    { label: "Acha #P033 — aksesswa", amount: "12 000 G", date: "18 Out" },
  ] },
];

function fmt(n: number) {
  return `${n.toLocaleString("fr-FR")} G`;
}

export default function ContactsPage() {
  const [kind, setKind] = useState<"customer" | "supplier">("customer");
  const [businessId, setBusinessId] = useState("wholesale");
  const [customers, setCustomers] = useState<Contact[]>(INITIAL_CUSTOMERS);
  const [suppliers, setSuppliers] = useState<Contact[]>(INITIAL_SUPPLIERS);
  const [query, setQuery] = useState("");
  const [formTarget, setFormTarget] = useState<"new" | Contact | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const list = kind === "customer" ? customers : suppliers;
  const setList = kind === "customer" ? setCustomers : setSuppliers;

  const filtered = useMemo(
    () =>
      list.filter(
        (c) => c.businessId === businessId && c.name.toLowerCase().includes(query.toLowerCase())
      ),
    [list, businessId, query]
  );

  function handleSave(values: ContactFormValues) {
    if (values.id) {
      setList((prev) => prev.map((c) => (c.id === values.id ? { ...c, ...values } : c)));
    } else {
      setList((prev) => [
        ...prev,
        {
          ...values,
          id: crypto.randomUUID(),
          businessId,
          totalAmount: 0,
          lastActivity: "Nouvo",
          history: [],
        },
      ]);
    }
    setFormTarget(null);
  }

  function handleDelete() {
    if (formTarget && formTarget !== "new") {
      setList((prev) => prev.filter((c) => c.id !== formTarget.id));
    }
    setFormTarget(null);
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-6 pb-24">
      <h1 className="font-display text-xl mb-4">Kliyan & Founisè</h1>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setKind("customer")}
          className={`flex-1 py-2.5 rounded-full text-sm font-medium border ${
            kind === "customer" ? "bg-ink text-paper border-ink" : "border-ink/15 dark:border-dark-border text-ink/70 dark:text-paper/70"
          }`}
        >
          Kliyan
        </button>
        <button
          onClick={() => setKind("supplier")}
          className={`flex-1 py-2.5 rounded-full text-sm font-medium border ${
            kind === "supplier" ? "bg-ink text-paper border-ink" : "border-ink/15 dark:border-dark-border text-ink/70 dark:text-paper/70"
          }`}
        >
          Founisè
        </button>
      </div>

      <BusinessSwitcher
        businesses={BUSINESSES}
        activeId={businessId}
        onSelect={setBusinessId}
        showOverviewTab={false}
      />

      <div className="flex gap-2 my-4">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40 dark:text-paper/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={kind === "customer" ? "Chèche yon kliyan..." : "Chèche yon founisè..."}
            className="w-full border border-ink/15 dark:border-dark-border rounded-full pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30"
          />
        </div>
        <button
          onClick={() => setFormTarget("new")}
          className="w-10 h-10 rounded-full bg-ink text-paper flex items-center justify-center shrink-0"
          aria-label={kind === "customer" ? "Ajoute yon kliyan" : "Ajoute yon founisè"}
        >
          <Plus size={18} />
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-ink/40 dark:text-paper/40">
          <Users size={28} className="mx-auto mb-2" />
          <p className="text-sm">
            {kind === "customer" ? "Pa gen kliyan ki koresponn." : "Pa gen founisè ki koresponn."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => {
            const expanded = expandedId === c.id;
            return (
              <div key={c.id} className="rounded-card border border-ink/10 dark:border-dark-border bg-white dark:bg-dark-surface overflow-hidden">
                <button
                  onClick={() => setExpandedId(expanded ? null : c.id)}
                  className="w-full text-left p-4 flex items-start justify-between"
                >
                  <div>
                    <p className="text-sm font-medium">{c.name}</p>
                    {c.phone && (
                      <p className="text-xs text-ink/50 dark:text-paper/50 flex items-center gap-1 mt-0.5">
                        <Phone size={11} /> {c.phone}
                      </p>
                    )}
                    <p className="text-xs text-ink/40 dark:text-paper/40 mt-0.5">{c.lastActivity}</p>
                  </div>
                  <div className="text-right">
                    <p className="stat-figure text-sm font-medium">{fmt(c.totalAmount)}</p>
                    <p className="text-xs text-ink/40 dark:text-paper/40">
                      {kind === "customer" ? "total faktire" : "total achte"}
                    </p>
                  </div>
                </button>

                {expanded && (
                  <div className="border-t border-ink/8 dark:border-dark-border/60 px-4 py-3">
                    {c.history.length > 0 && (
                      <div className="mb-3 space-y-2">
                        <p className="text-xs font-medium text-ink/60 dark:text-paper/60 flex items-center gap-1">
                          <Receipt size={12} /> Istorik
                        </p>
                        {c.history.map((h) => (
                          <div key={h.label} className="flex justify-between text-xs">
                            <span className="text-ink/70 dark:text-paper/70">{h.label}</span>
                            <span className="stat-figure text-ink/50 dark:text-paper/50">
                              {h.amount} · {h.date}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => setFormTarget(c)}
                      className="text-xs font-medium text-forest underline underline-offset-2"
                    >
                      Modifye enfòmasyon
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {formTarget && (
        <ContactForm
          kind={kind}
          initial={formTarget === "new" ? undefined : formTarget}
          onSave={handleSave}
          onDelete={formTarget !== "new" ? handleDelete : undefined}
          onClose={() => setFormTarget(null)}
        />
      )}
    </main>
  );
}
