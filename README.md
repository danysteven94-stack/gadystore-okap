# Gady's — Gestion Multi-Business

Application SaaS pour gérer plusieurs entreprises (ventes, achats, stocks, clients, fournisseurs, factures PDF, rapports) depuis un seul compte.

**Entreprises gérées :** créées par l'utilisateur admin directement depuis
l'application (bouton "+" sur le tableau de bord) — aucune entreprise n'est
pré-remplie, tout est connecté à Upstash en temps réel.

## Stack

- **Frontend** — Next.js 15 (App Router), React, TypeScript, Tailwind CSS
- **Backend** — Next.js API Routes, Server Actions
- **Base de données** — Upstash Redis
- **Auth** — JWT (jose) + bcrypt, RBAC (admin / gestionnaire / caissier)
- **Factures** — @react-pdf/renderer
- **Hébergement** — Vercel

## Démarrage rapide

```bash
npm install
cp .env.example .env.local   # remplir les clés Upstash + JWT_SECRET
npm run dev
```

L'application démarre sur `http://localhost:3000`.

## Structure du projet

```
src/
  app/
    (auth)/login/          → page de connexion
    (dashboard)/dashboard/ → tableau de bord multi-entreprises + vue d'ensemble
    (dashboard)/pos/       → système de vente (POS)
    (dashboard)/products/  → gestion complète des produits & du stock
    (dashboard)/contacts/  → gestion complète des clients & fournisseurs
    verify/[saleId]/       → vérification publique d'une facture (lien QR code)
    api/
      auth/login/          → authentification
      businesses/          → CRUD entreprises
      products/            → CRUD produits (liste + création)
      products/[id]/        → modifier / supprimer un produit
      customers/, customers/[id]/ → CRUD clients
      suppliers/, suppliers/[id]/ → CRUD fournisseurs
      purchases/             → achats fournisseurs (entrée de stock automatique)
      sales/                → POS / création de vente
      expenses/             → dépenses par catégorie
      dashboard/            → agrégation temps réel (profit = revenus − dépenses)
      notifications/        → stock faible, nouvelle vente, grosse dépense
      reports/               → ventes, stock, financier (export Excel)
      backup/, backup/restore/, backup/cron/ → sauvegarde quotidienne
      invoices/[saleId]/     → génération PDF (logo, QR code, signature)
      invoices/send/          → envoi email (Resend) ou lien WhatsApp
  components/
    dashboard/              → BusinessSwitcher, StatCard, RevenueChart, BusinessBreakdown
    pos/                     → Cart, BarcodeScanner
    products/                → StockBar, ProductForm
    contacts/                → ContactForm (clients & fournisseurs)
    nav/                      → BottomNav, AppChrome (masque la nav sur /login, /verify)
    providers/                → ThemeProvider (mode sombre)
    ui/                      → composants réutilisables
  lib/
    i18n/                     → dictionary.ts (traductions), language-provider.tsx
    upstash.ts               → client Redis + convention des clés
    auth.ts                  → JWT, hashing, permissions RBAC
    notifications.ts         → création de notifications automatiques
    pdf/invoice.tsx           → template de facture PDF
  types/                     → types partagés (Business, Product, Sale...)
  middleware.ts               → protection des routes /dashboard
scripts/
  seed-admin.ts               → crée le premier utilisateur Administrateur
```

## Modèle de données Upstash

Voir les commentaires dans `src/lib/upstash.ts` pour la convention de clés
(`business:{id}`, `product:{id}`, `sale:{id}`, etc.).

## Ce qui est déjà en place

- [x] Structure du projet et configuration Tailwind (palette forêt/or)
- [x] Page de connexion + API `/api/auth/login`
- [x] Middleware RBAC protégeant `/dashboard`
- [x] Tableau de bord multi-entreprises **connecté en temps réel** à l'API/Upstash
      (plus de données factices) — sélecteur, KPIs, stock faible, ventes récentes
- [x] API `/api/businesses` (liste + création)
- [x] API `/api/products` (liste + création, calcul automatique du stock faible)
- [x] API `/api/sales` (POS : création de vente, sortie de stock automatique)
- [x] Génération de facture PDF professionnelle (`/api/invoices/[saleId]`) — logo,
      infos entreprise/client, tableau produits, sous-total/remise/taxe/total,
      **QR code de vérification** et ligne de signature numérique
- [x] API `/api/expenses` (catégories: salaires, transport, loyer, électricité,
      internet, divers)
- [x] API `/api/dashboard` — agrège ventes + dépenses du jour et calcule le
      profit net automatiquement (Profit = Revenus − Dépenses)
- [x] Notifications automatiques (`src/lib/notifications.ts`) déclenchées sur
      stock faible, nouvelle vente et dépense importante — lues via `/api/notifications`
- [x] Rapport financier exportable en Excel (`/api/reports/financial?format=excel`)
      sur une plage de dates, avec totaux
- [x] Rapport de ventes détaillé (`/api/reports/sales`) — produits les plus
      vendus, répartition par mode de paiement
- [x] Rapport de stock (`/api/reports/stock`) — disponible / faible / rupture,
      valeur totale du stock
- [x] Sauvegarde automatique quotidienne (`/api/backup` + Vercel Cron à 4h du
      matin via `vercel.json`) et restauration (`/api/backup/restore`, réservée
      à l'Administrateur Principal)
- [x] Envoi de facture par email (Resend) ou lien WhatsApp direct
      (`/api/invoices/send`)
- [x] Scanner de code-barres en temps réel via la caméra (`html5-qrcode`) —
      composant `BarcodeScanner`
- [x] Interface POS complète (`/pos`) — panier, taxe, choix du mode de paiement
- [x] Graphiques de vente/profit sur 7 jours (`recharts`) sur le tableau de bord
- [x] Page `/verify/[saleId]` liée au QR code des factures
- [x] Vue d'ensemble "Tout Antrepriz" — chiffre d'affaires combiné, profit
      total et répartition par entreprise (`BusinessBreakdown`)
- [x] Script `npm run seed:admin` pour créer le premier utilisateur
- [x] Page `/products` — **connectée en temps réel** à `/api/products` (plus
      de données factices) : recherche,
      filtre par catégorie, ajout/modification/suppression, barre de stock
      colorée (anfòm / fèb / rupti), valeur totale du stock
- [x] API `/api/products/[id]` (PATCH / DELETE) pour modifier ou supprimer
      un produit individuel
- [x] Page `/contacts` — **connectée en temps réel** à `/api/customers` et
      `/api/suppliers` (bascule
      Kliyan/Founisè), historique de factures/achats par contact, ajout/
      modification/suppression
- [x] API `/api/customers`, `/api/suppliers` (+ `[id]` pour modifier/supprimer)
- [x] **Sidebar desktop pwofesyonèl** (`Sidebar`) — navigasyon konplè, lojo,
      switch tèm/lang, dekonèkte — parèt otomatikman sou gwo ekran (`lg:`),
      nav mobile an ba a rete pou telefòn
- [x] Page `/businesses` — jesyon konplè antrepriz yo ak kat pwofesyonèl
      (icon, tags/kategori, monnen, taks), modifye/efase yon antrepriz
- [x] API `/api/businesses/[id]` (PATCH/DELETE)
- [x] Chan `tags` sou Business — kategori ki parèt sou kat antrepriz la
- [x] **Sidebar konplè (11 seksyon)** ak **nav mobil ki defile** ak menm lis la:
      Tablo Debò, Antrepriz, Pwodwi, Stok, Kliyan, Founisè, Vant, Retou
      Machandiz, Depans, Rapò, Sovgad
- [x] Page `/stock` — rapò stok detaye (anfòm / fèb / rupti) ak valè total
- [x] Page `/expenses` — anrejistre ak gade depans pa kategori
- [x] Page `/reports` — rapò finansye + pi bon pwodwi + mòd peman, ak
      espòte Excel
- [x] Page `/backup` — kreye sovgad manyèl, gade istorik, restore
- [x] **Sistèm Retou Machandiz** (`/returns` + `/api/returns`) — remèt stok
      la otomatikman
- [x] **Nouvo idantite vizyèl** — "Platfòm Antrepriz", palèt vyolèt/anbrè/rose
- [x] **Plizyè kont itilizatè, done separe** — API `/api/users` (GET/POST,
      admin sèlman) + page `/users` pou kreye nouvo kont (Administratè,
      Jesyonè, oswa Kesye). Chak kont `admin` kòmanse ak pwòp `businessIds`
      vid — antrepriz li kreye yo pa janm melanje ak lòt kont
- [x] **Dekonèkte ki fonksyone vre** — `/api/auth/logout` efase cookie
      sesyon an; bouton "Dekonekte" nan sidebar/nav mobil itilize l kounye a
      olye yon senp lyen ki pa t fè anyen
- [x] **Imèl nòmalize** (miniskil, san espas) nan login/kreyasyon kont — evite
      erè "modpas oswa imèl pa kòrèk" akoz yon diferans majiskil/miniskil
- [x] **Kont "prensipal" (super-admin)** — `danystevenj@gmail.com` (chanjab
      via varyab anviwònman `SUPER_ADMIN_EMAIL`) se sèl kont ki ka efase lòt
      administratè, via `/api/users/[email]` (DELETE) ak bouton nan paj
      `/users`. Pa gen okenn lòt kont, menm yon lòt administratè, ki ka fè sa
- [x] **Mode sombre** — `ThemeProvider` (persisté + détection préférence
      système), bascule dans la nav du bas, palette `dark-bg/surface/border`
- [x] **Multi-langues (Kreyòl / Français / English)** — `LanguageProvider` +
      dictionnaire (`src/lib/i18n/`), sélecteur dans la nav du bas. Le socle
      (navigation, tableau de bord, produits, contacts) est traduit ; étendre
      `dictionary.ts` pour couvrir le reste des écrans
- [x] **Navigation en bas** (`BottomNav`) reliant Tableau de bord / Kès / Pwodwi
      / Kontak — masquée sur `/login` et `/verify`

## Prochaines étapes suggérées

- [ ] Traduire les chaînes restantes (formulaires, POS, factures) via `dictionary.ts`
- [ ] Déploiement Vercel + connexion GitHub

## Déploiement

1. Pousser le projet sur GitHub
2. Importer le repo sur [vercel.com](https://vercel.com)
3. Ajouter les variables d'environnement (`.env.example`) dans les réglages du projet Vercel
4. Créer une base Upstash Redis et copier les identifiants REST
