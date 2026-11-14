"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Heart, KeyRound, Loader2, LogOut, MapPin, MessageCircle, Package, Trash2, User } from "lucide-react";
import { useShop, useT } from "./shop-context";
import { InstallButton } from "./install-app";
import { C, fieldClass, fieldStyle } from "./ui";

type Tab = "login" | "register" | "profile" | "orders" | "settings";

const FULFILL_LABEL: Record<string, string> = {
  new: "Resevwa",
  confirmed: "Konfime",
  preparing: "Ap prepare",
  shipped: "Nan wout",
  delivered: "Livre",
  cancelled: "Anile||status",
};

async function call(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

function Label({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1.5">{text}</span>
      {children}
    </label>
  );
}

function ErrorLine({ msg }: { msg: string | null }) {
  return msg ? (
    <p role="alert" className="text-sm font-medium rounded-xl px-4 py-3" style={{ color: C.red, background: "#FDECEF" }}>
      {msg}
    </p>
  ) : null;
}

function Submit({ busy, children }: { busy: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="w-full rounded-full py-3.5 font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
      style={{ background: C.ink }}
    >
      {busy && <Loader2 size={18} className="animate-spin" />} {children}
    </button>
  );
}

export function AccountPage() {
  const t = useT();
  const { shop, base, account, accountReady, accountOrders } = useShop();
  const sp = useSearchParams();
  const [picked, setPicked] = useState<Tab | null>(null);

  useEffect(() => {
    const t = sp.get("tab");
    if (t === "login" || t === "register" || t === "settings") setPicked(t);
  }, [sp]);

  // Sa k afiche a depann de si kliyan an konekte oswa non
  let tab: Tab = picked ?? (account ? "profile" : "login");
  if (account && (tab === "login" || tab === "register")) tab = "profile";
  if (!account && (tab === "profile" || tab === "orders")) tab = "login";

  const tabs: { id: Tab; label: string }[] = account
    ? [
        { id: "profile", label: t("Pwofil") },
        { id: "orders", label: accountOrders.length ? t("Kòmand ({n})", { n: accountOrders.length }) : t("Kòmand") },
        { id: "settings", label: t("Setting") },
      ]
    : [
        { id: "login", label: t("Konekte") },
        { id: "register", label: t("Kreye kont") },
        { id: "settings", label: t("Setting") },
      ];

  return (
    <main className="max-w-xl mx-auto px-4 py-6 sm:py-10">
      <div className="flex items-center gap-3 mb-6">
        <span className="w-12 h-12 rounded-full flex items-center justify-center text-white shrink-0" style={{ background: C.ink }}>
          <User size={22} />
        </span>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold leading-tight truncate">{account ? account.name : t("Kont mwen")}</h1>
          <p className="text-sm truncate" style={{ color: C.muted }}>
            {account ? account.email : t("Konekte oswa kreye yon kont sou {shop}", { shop: shop.name })}
          </p>
        </div>
      </div>

      <div role="tablist" className="grid grid-cols-3 gap-1 rounded-full p-1 mb-6" style={{ background: C.soft }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setPicked(t.id)}
            className="rounded-full py-2.5 text-sm font-semibold transition-colors"
            style={tab === t.id ? { background: C.ink, color: "#fff" } : { color: C.ink }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {!accountReady && tab !== "settings" ? (
        <div className="py-16 flex justify-center"><Loader2 className="animate-spin" /></div>
      ) : (
        <>
          {tab === "login" && <LoginForm goRegister={() => setPicked("register")} />}
          {tab === "register" && <RegisterForm goLogin={() => setPicked("login")} />}
          {tab === "profile" && account && <ProfileForm />}
          {tab === "orders" && account && <Orders />}
          {tab === "settings" && <Settings base={base} />}
        </>
      )}
    </main>
  );
}

/* ------------------------------ Koneksyon ------------------------------ */

function LoginForm({ goRegister }: { goRegister: () => void }) {
  const t = useT();
  const { shop, setAccount, refreshAccount, showToast } = useShop();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { ok, data } = await call(`/api/shop/${shop.slug}/account/login`, "POST", { email, password });
      if (!ok) {
        setError(data.error ? t(data.error) : t("Pa ka konekte. Eseye ankò."));
        return;
      }
      setAccount(data.customer);
      await refreshAccount();
      showToast("Ou konekte ✓");
    } catch {
      setError(t("Erè rezo — verifye entènèt ou."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Label text={t("Imèl")}>
        <input className={fieldClass} style={fieldStyle} type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </Label>
      <Label text={t("Modpas")}>
        <input className={fieldClass} style={fieldStyle} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </Label>
      <ErrorLine msg={error} />
      <Submit busy={busy}>{t("Konekte")}</Submit>
      <p className="text-center text-sm" style={{ color: C.muted }}>
        {t("Poko gen kont?")}{" "}
        <button type="button" onClick={goRegister} className="font-semibold underline" style={{ color: C.ink }}>
          {t("Kreye youn")}
        </button>
      </p>
    </form>
  );
}

/* ------------------------------ Kreye kont ------------------------------ */

function RegisterForm({ goLogin }: { goLogin: () => void }) {
  const t = useT();
  const { shop, setAccount, refreshAccount, showToast } = useShop();
  const [f, setF] = useState({ name: "", phone: "", email: "", address: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (f.password.length < 8) {
      setError(t("Modpas la dwe gen omwen 8 karaktè."));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { ok, data } = await call(`/api/shop/${shop.slug}/account/register`, "POST", f);
      if (!ok) {
        setError(data.error ? t(data.error) : t("Pa ka kreye kont lan. Eseye ankò."));
        return;
      }
      setAccount(data.customer);
      await refreshAccount();
      showToast("Kont kreye ✓");
    } catch {
      setError(t("Erè rezo — verifye entènèt ou."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Label text={t("Non konplè")}>
        <input className={fieldClass} style={fieldStyle} autoComplete="name" value={f.name} onChange={set("name")} required minLength={2} maxLength={80} />
      </Label>
      <Label text={t("Nimewo telefòn")}>
        <input className={fieldClass} style={fieldStyle} type="tel" autoComplete="tel" inputMode="tel" placeholder="+509 ..." value={f.phone} onChange={set("phone")} required />
      </Label>
      <Label text={t("Imèl")}>
        <input className={fieldClass} style={fieldStyle} type="email" autoComplete="email" inputMode="email" value={f.email} onChange={set("email")} required />
      </Label>
      <Label text={t("Adrès (pou livrezon)")}>
        <textarea className={fieldClass} style={fieldStyle} rows={2} autoComplete="street-address" maxLength={200} value={f.address} onChange={set("address")} placeholder={t("Katye, ri, vil...")} />
      </Label>
      <Label text={t("Modpas (omwen 8 karaktè)")}>
        <input className={fieldClass} style={fieldStyle} type="password" autoComplete="new-password" minLength={8} value={f.password} onChange={set("password")} required />
      </Label>
      <ErrorLine msg={error} />
      <Submit busy={busy}>{t("Kreye kont mwen")}</Submit>
      <p className="text-center text-xs" style={{ color: C.muted }}>
        {(() => {
          const [pre, post] = t("Nou itilize enfòmasyon sa yo sèlman pou trete kòmand ou yo. Gade {link}.", { link: "\u0000" }).split("\u0000");
          return (
            <>
              {pre}
              <Link href="/privacy" className="underline">{t("politik konfidansyalite")}</Link>
              {post}
            </>
          );
        })()}
      </p>
      <p className="text-center text-sm" style={{ color: C.muted }}>
        {t("Gen yon kont deja?")}{" "}
        <button type="button" onClick={goLogin} className="font-semibold underline" style={{ color: C.ink }}>
          {t("Konekte")}
        </button>
      </p>
    </form>
  );
}

/* ------------------------------ Pwofil ------------------------------ */

function ProfileForm() {
  const t = useT();
  const { shop, account, setAccount, showToast } = useShop();
  const [name, setName] = useState(account?.name ?? "");
  const [phone, setPhone] = useState(account?.phone ?? "");
  const [address, setAddress] = useState(account?.address ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!account) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { ok, data } = await call(`/api/shop/${shop.slug}/account/me`, "PATCH", { name, phone, address });
      if (!ok) {
        setError(data.error ? t(data.error) : t("Pa ka sove. Eseye ankò."));
        return;
      }
      setAccount(data.customer);
      showToast("Pwofil sove ✓");
    } catch {
      setError(t("Erè rezo — verifye entènèt ou."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Label text={t("Non konplè")}>
        <input className={fieldClass} style={fieldStyle} value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={80} />
      </Label>
      <Label text={t("Nimewo telefòn")}>
        <input className={fieldClass} style={fieldStyle} type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
      </Label>
      <Label text={t("Imèl")}>
        <input className={`${fieldClass} opacity-60`} style={fieldStyle} value={account.email} disabled />
      </Label>
      <Label text={t("Adrès")}>
        <textarea className={fieldClass} style={fieldStyle} rows={2} maxLength={200} value={address} onChange={(e) => setAddress(e.target.value)} />
      </Label>
      <ErrorLine msg={error} />
      <Submit busy={busy}>{t("Sove chanjman yo")}</Submit>
    </form>
  );
}

/* ------------------------------ Kòmand ------------------------------ */

function Orders() {
  const t = useT();
  const { base, money, accountOrders } = useShop();
  if (accountOrders.length === 0) {
    return (
      <div className="text-center py-14">
        <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: C.soft }}><Package size={28} /></div>
        <p className="font-semibold">{t("Ou poko gen kòmand")}</p>
        <p className="text-sm mt-1" style={{ color: C.muted }}>{t("Kòmand ou pase lè w konekte yo ap parèt isit la.")}</p>
      </div>
    );
  }
  return (
    <ul className="space-y-2">
      {accountOrders.map((o) => (
        <li key={o.code}>
          <Link
            href={`${base}/track?code=${o.code}&phone=${encodeURIComponent(o.phone)}`}
            className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3"
            style={{ borderColor: C.line }}
          >
            <span className="min-w-0">
              <b>#{o.code}</b>
              <span className="block text-xs" style={{ color: C.muted }}>
                {new Date(o.createdAt).toLocaleDateString("fr-FR")} · {t(FULFILL_LABEL[o.fulfillment] ?? o.fulfillment)}
              </span>
            </span>
            <span className="font-bold tabular-nums shrink-0">{money(o.total)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------ Setting ------------------------------ */

function Settings({ base }: { base: string }) {
  const t = useT();
  const { shop, account, logoutAccount, showToast } = useShop();
  const waHello = shop.whatsapp
    ? `https://wa.me/${shop.whatsapp}?text=${encodeURIComponent(t("Bonjou {shop}, mwen bezwen èd.", { shop: shop.name }))}`
    : null;

  return (
    <div className="space-y-6">
      <Section title={t("App la")}>
        <InstallButton />
      </Section>

      <Section title={t("Rakousi")}>
        <ul className="divide-y rounded-xl border" style={{ borderColor: C.line }}>
          <RowLink href={`${base}/track`} icon={<Package size={18} />} text={t("Swiv yon kòmand")} />
          <RowLink href={`${base}/wishlist`} icon={<Heart size={18} />} text={t("Favori mwen")} />
          <RowLink href={`${base}/about`} icon={<MapPin size={18} />} text={t("Livrezon, peman ak retou")} />
          {waHello && <RowLink href={waHello} external icon={<MessageCircle size={18} />} text={t("Kontakte nou sou WhatsApp")} />}
        </ul>
      </Section>

      {account && (
        <>
          <ChangePassword />
          <Section title={t("Sesyon")}>
            <button
              onClick={async () => {
                await logoutAccount();
                showToast("Ou dekonekte");
              }}
              className="w-full rounded-full border py-3 font-semibold flex items-center justify-center gap-2"
              style={{ borderColor: C.line }}
            >
              <LogOut size={18} /> {t("Dekonekte")}
            </button>
          </Section>
          <DeleteAccount />
        </>
      )}

      <p className="text-center text-xs" style={{ color: C.muted }}>
        <Link href="/privacy" className="underline">{t("Konfidansyalite")}</Link> · <Link href="/terms" className="underline">{t("Kondisyon")}</Link>
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-sm font-bold uppercase tracking-wide mb-2" style={{ color: C.muted }}>{title}</h2>
      {children}
    </section>
  );
}

function RowLink({ href, icon, text, external }: { href: string; icon: React.ReactNode; text: string; external?: boolean }) {
  const cls = "flex items-center gap-3 px-4 py-3.5 text-[15px] font-medium";
  return (
    <li>
      {external ? (
        <a href={href} target="_blank" rel="noreferrer" className={cls}>{icon}{text}</a>
      ) : (
        <Link href={href} className={cls}>{icon}{text}</Link>
      )}
    </li>
  );
}

function ChangePassword() {
  const t = useT();
  const { shop, showToast } = useShop();
  const [open, setOpen] = useState(false);
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { ok, data } = await call(`/api/shop/${shop.slug}/account/me`, "PATCH", { currentPassword: cur, newPassword: next });
      if (!ok) {
        setError(data.error ? t(data.error) : t("Pa ka chanje modpas la."));
        return;
      }
      setCur("");
      setNext("");
      setOpen(false);
      showToast("Modpas chanje ✓");
    } catch {
      setError(t("Erè rezo — verifye entènèt ou."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section title={t("Sekirite")}>
      {!open ? (
        <button onClick={() => setOpen(true)} className="w-full rounded-full border py-3 font-semibold flex items-center justify-center gap-2" style={{ borderColor: C.line }}>
          <KeyRound size={18} /> {t("Chanje modpas")}
        </button>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <input className={fieldClass} style={fieldStyle} type="password" autoComplete="current-password" placeholder={t("Modpas aktyèl")} value={cur} onChange={(e) => setCur(e.target.value)} required />
          <input className={fieldClass} style={fieldStyle} type="password" autoComplete="new-password" placeholder={t("Nouvo modpas (omwen 8 karaktè)")} minLength={8} value={next} onChange={(e) => setNext(e.target.value)} required />
          <ErrorLine msg={error} />
          <Submit busy={busy}>{t("Chanje modpas")}</Submit>
        </form>
      )}
    </Section>
  );
}

function DeleteAccount() {
  const t = useT();
  const { shop, setAccount, showToast } = useShop();
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!confirm(t("Ou sèten ou vle efase kont ou? Aksyon sa a pa ka defèt."))) return;
    setBusy(true);
    setError(null);
    try {
      const { ok, data } = await call(`/api/shop/${shop.slug}/account/me`, "DELETE", { password: pw });
      if (!ok) {
        setError(data.error ? t(data.error) : t("Pa ka efase kont lan."));
        return;
      }
      setAccount(null);
      showToast("Kont efase");
    } catch {
      setError(t("Erè rezo — verifye entènèt ou."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section title={t("Zòn danje")}>
      {!open ? (
        <button onClick={() => setOpen(true)} className="w-full rounded-full border py-3 font-semibold flex items-center justify-center gap-2" style={{ borderColor: C.red, color: C.red }}>
          <Trash2 size={18} /> {t("Efase kont mwen")}
        </button>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <p className="text-sm" style={{ color: C.muted }}>
            {t("Non, telefòn, imèl ak adrès ou ap efase. Antre modpas ou pou konfime.")}
          </p>
          <input className={fieldClass} style={fieldStyle} type="password" autoComplete="current-password" placeholder={t("Modpas ou")} value={pw} onChange={(e) => setPw(e.target.value)} required />
          <ErrorLine msg={error} />
          <button type="submit" disabled={busy} className="w-full rounded-full py-3.5 font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60" style={{ background: C.red }}>
            {busy && <Loader2 size={18} className="animate-spin" />} {t("Efase kont lan pou toutbon")}
          </button>
        </form>
      )}
    </Section>
  );
}
