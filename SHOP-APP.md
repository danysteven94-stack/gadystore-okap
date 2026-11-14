# App boutik (kont kliyan + enstale sou telefòn)

## 1. Kont kliyan sou boutik la
Nan `/boutik/{slug}/account` (ikòn **Kont** nan bann anba telefòn nan, ikòn moun nan tèt paj la sou òdinatè):

| Tab (dekonekte) | Tab (konekte) | Sa li fè |
|---|---|---|
| **Konekte** | **Pwofil** | Imèl + modpas / modifye non, telefòn, adrès |
| **Kreye kont** | **Kòmand** | Non, telefòn, imèl, adrès, modpas (min. 8) / dènye kòmand yo ak swivi |
| **Setting** | **Setting** | Enstale app, rakousi, chanje modpas, dekonekte, **efase kont** |

- Konekte → checkout la ranpli otomatikman (non, telefòn, adrès). Kòmand yo lye ak kont lan.
- Kont yo **separe pa boutik** (menm imèl ka gen yon kont sou chak boutik) epi **pa gen rapò** ak kont administratè yo
  (cookie `shopcust_{slug}`, JWT ak `purpose: "shop-customer"` ki rejte pa `verifySession`).
- Kliyan yo parèt tou nan **Kontak** (dashboard) pou pwopriyetè a.
- Sekirite: modpas bcrypt, limit eseye pa IP ak pa imèl, imèl inik reziste kous (SET NX).
- **Poko fè:** "modpas bliye" pa imèl, verifikasyon imèl (bezwen Resend; `RESEND_API_KEY` deja nan `.env.example`).

Kle Redis nouvo: `shopcust:{id}`, `shopcust:email:{businessId}:{email}`, `shopcust:{id}:orders`, `business:{id}:shopcustomers`.

## 2. Enstale boutik la sou ekran telefòn nan (PWA — gratis, san store)
Chak boutik gen **pwòp manifest ak pwòp ikòn** (logo boutik la, mete nan dashboard → Boutik):
- `/api/shop/{slug}/manifest` — non, koulè, `start_url=/boutik/{slug}`
- `/api/shop/{slug}/icon?size=192|512|180&kind=any|maskable|splash` — jenere ak logo a (si pa gen logo: premye lèt non an)

Kliyan an wè yon ti bann **"Enstale app {boutik}"** (Android/Chrome) oswa eksplikasyon **Pataje → Sou ekran dakèy** (iPhone).
Bouton an tou nan **Kont → Setting**. Chanje logo a → ikòn nan chanje (paramèt `v=`), men yon app ki deja enstale ka pran kèk jou pou mete l ajou.

> Pou logo a parèt kòrèk: sèvi ak yon imaj **kare**, **JPEG/PNG** (upload dashboard la konvèti an JPEG otomatikman).

## 3. App Store / Play Store (yon app pou chak boutik)
Capacitor (deja nan pwojè a) ankapsile boutik la. Pou **chak** boutik:
1. Kopye pwojè a nan yon nouvo dosye (**san** `android/` ak `ios/`, san `node_modules`).
2. ```bash
   APP_URL=https://non-ou.vercel.app SHOP_SLUG=boutik-mwen \
   APP_ID=com.boutikmwen.app APP_NAME="Boutik Mwen" bash scripts/shop-app-setup.sh
   ```
   (li telechaje logo a, jenere ikòn + splash, mete pèmisyon, epi `cap sync`)
3. Android: `npm run cap:android` → Generate Signed Bundle → Play Console. iOS (Mac): `npm run cap:ios` → Archive → App Store Connect.
   Rès pwosesis la (kont dev, keystore, screenshots, privacy URL) = `MOBILE.md`.

Pou revizyon yo:
- **Efasman kont**: egziste nan app la (Kont → Setting → Efase kont mwen) — **obligatwa** pou Apple (5.1.1v) ak Google (ranpli URL `https://URL/boutik/{slug}/account?tab=settings` nan "Account deletion").
- **Apple 4.2**: yon sit anbale tou senp ka rejte. Boutik sa a gen kont, panye, swivi kòmand, favori, enstalasyon — ajoute fonksyon natif (notifikasyon push, `@capacitor/share`) si Apple rejte.
- **Peman** (MonCash/NatCash/kach pou machandiz fizik) pa bezwen In-App Purchase (Apple 3.1.3(e)).
- Bay yon kont demo (imèl + modpas) nan notes revizyon an, epi mete `/privacy` ajou ak done kliyan yo kolekte (non, telefòn, imèl, adrès).
