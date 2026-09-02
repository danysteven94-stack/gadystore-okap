"use client";

import { useEffect, useMemo, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Plus, Users, Phone, Loader2 } from "lucide-react";
import { BusinessSwitcher } from "@/components/dashboard/business-switcher";
import { ContactForm, type ContactFormValues } from "@/components/contacts/contact-form";
import type { Business, Customer, Supplier } from "@/types";

type Contact = Customer | Supplier;

function ContactsPageInner() {
  const searchParams = useSearchParams();
  const initialKind = searchParams.get("kind") === "supplier" ? "supplier" : "customer";

  const [businesses, setBusinesses] = useState<Business[] | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [kind, setKind] = useState<"customer" | "supplier">(initialKind);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [query, setQuery] = useState("");
  const [formTarget, setFormTarget] = useState<"new" | Contact | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/businesses")
      .then((res) => res.json())
      .then((data) => {
        setBusinesses(data.businesses ?? []);
        if (data.businesses?.length) setBusinessId(data.businesses[0].id);
      })
      .catch(() => setBusinesses([]));
  }, []);

  const endpoint = kind === "customer" ? "/api/customers" : "/api/suppliers";
  const listKey = kind === "customer" ? "customers" : "suppliers";

  const loadContacts = useCallback(async () => {
    if (!businessId) return;
    setLoadingContacts(true);
    try {
      const res = await fetch(`${endpoint}?businessId=${businessId}`);
      const data = await res.json();
      setContacts((data[listKey] ?? []).filter(Boolean));
    } catch {
      setError("Pa ka chaje lis la.");
    }
    setLoadingContacts(false);
  }, [businessId, endpoint, listKey]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const filtered = useMemo(
    () => contacts.filter((c) => c.name.toLowerCase().includes(query.toLowerCase())),
    [contacts, query]
  );

  async function handleSave(values: ContactFormValues) {
    if (!businessId) return;
    setError(null);
    const payload = {
      ...values,
      email: values.email.trim() || undefined,
      phone: values.phone.trim() || undefined,
      address: values.address.trim() || undefined,
    };
    try {
      if (values.id) {
        const res = await fetch(`${endpoint}/${values.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
      } else {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, businessId }),
        });
        if (!res.ok) throw new Error();
      }
      setFormTarget(null);
      await loadContacts();
    } catch {
      setError("Pa ka anrejistre. Eseye ankò.");
    }
  }

  async function handleDelete() {
    if (formTarget && formTarget !== "new") {
      try {
        await fetch(`${endpoint}/${formTarget.id}`, { method: "DELETE" });
      } catch {
        setError("Pa ka efase.");
      }
    }
    setFormTarget(null);
    await loadContacts();
  }

  if (businesses === null) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 flex flex-col items-center text-ink/40 dark:text-paper/40">
        <Loader2 size={24} className="animate-spin mb-2" />
        <p className="text-sm">Ap chaje...</p>
      </main>
    );
  }

  if (businesses.length === 0) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 text-center">
        <Users size={28} className="mx-auto mb-3 text-ink/30" />
        <p className="text-sm text-ink/60 dark:text-paper/60">
          Ale nan Tablo Debò a pou kreye premye antrepriz ou anvan.
        </p>
      </main>
    );
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
        businesses={businesses.map((b) => ({ id: b.id, name: b.name, icon: b.icon }))}
        activeId={businessId ?? ""}
        onSelect={setBusinessId}
        showOverviewTab={false}
      />

      <div className="flex gap-2 my-4">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={kind === "customer" ? "Chèche yon kliyan..." : "Chèche yon founisè..."}
            className="w-full border border-ink/15 dark:border-dark-border bg-white dark:bg-dark-surface rounded-full pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30"
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

      {error && <p className="text-sm text-brick mb-3">{error}</p>}

      {loadingContacts ? (
        <div className="flex justify-center py-10 text-ink/40 dark:text-paper/40">
          <Loader2 size={20} className="animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-ink/40 dark:text-paper/40">
          <Users size={28} className="mx-auto mb-2" />
          <p className="text-sm">
            {contacts.length === 0
              ? kind === "customer"
                ? "Ou poko gen kliyan. Ajoute premye a."
                : "Ou poko gen founisè. Ajoute premye a."
              : "Pa gen rezilta ki koresponn."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => setFormTarget(c)}
              className="w-full text-left rounded-card border border-ink/10 dark:border-dark-border bg-white dark:bg-dark-surface p-4"
            >
              <p className="text-sm font-medium">{c.name}</p>
              {c.phone && (
                <p className="text-xs text-ink/50 dark:text-paper/50 flex items-center gap-1 mt-0.5">
                  <Phone size={11} /> {c.phone}
                </p>
              )}
            </button>
          ))}
        </div>
      )}

      {formTarget && (
        <ContactForm
          kind={kind}
          initial={
            formTarget === "new"
              ? undefined
              : {
                  id: formTarget.id,
                  name: formTarget.name,
                  phone: formTarget.phone ?? "",
                  email: formTarget.email ?? "",
                  address: formTarget.address ?? "",
                }
          }
          onSave={handleSave}
          onDelete={formTarget !== "new" ? handleDelete : undefined}
          onClose={() => setFormTarget(null)}
        />
      )}
    </main>
  );
}

export default function ContactsPage() {
  return (
    <Suspense fallback={null}>
      <ContactsPageInner />
    </Suspense>
  );
}
