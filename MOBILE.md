# Mete Platfòm Antrepriz sou Play Store ak App Store

App la rete yon sèl kòd (Next.js sou Vercel). Capacitor mete l nan yon kokiy natif
Android/iOS ki chaje URL Vercel ou a. Chak fwa ou deplwaye sou Vercel, app mobil la
mete ajou otomatikman (san re-soumèt nan stòr yo, sof si ou chanje pati natif la).

## 0. Anvan tout bagay
1. Deplwaye sou Vercel, mete tout varyab `.env.example` (JWT_SECRET **obligatwa** kounye a).
2. Mete `NEXT_PUBLIC_SUPPORT_EMAIL` sou Vercel. Verifye `https://URL/privacy` ak `/account-deletion` louvri.
3. Chanje `appId` nan `capacitor.config.ts` si ou vle (`com.gadys.platfom`) — sa pa chanje apre piblikasyon.

## 1. Kreye pwojè natif la
```bash
APP_URL=https://non-ou.vercel.app bash scripts/mobile-setup.sh
```
(Mac pou iOS; Windows/Linux/Mac pou Android.) Li enstale Capacitor, jenere ikòn/splash,
ajoute pèmisyon kamera, epi sync.

## 2. Android → Play Store
- Bezwen: Android Studio, kont Google Play Developer (25 $ yon sèl fwa).
- `npm run cap:android` → Build → **Generate Signed App Bundle (.aab)** → kreye keystore
  (**sove l ak modpas li — si ou pèdi l, ou pa ka mete ajou app la**).
- Play Console: kreye app, telechaje `.aab`, ranpli:
  - Privacy policy URL: `https://URL/privacy`
  - Data safety + **Account deletion URL**: `https://URL/account-deletion`
  - Screenshots telefòn (min. 2), ikòn 512 (`public/icons/icon-512.png`), feature graphic 1024×500
  - Nouvo kont pèsonèl: 12 testè pandan 14 jou anvan piblikasyon piblik.
  - Bay yon kont demo (imèl + modpas) nan "App access" paske login obligatwa.

## 2b. iOS → App Store
- Bezwen: Mac + Xcode, Apple Developer Program (99 $/an).
- `npm run cap:ios` → Signing & Capabilities: chwazi Team → Product → Archive → Distribute (App Store Connect).
- App Store Connect: ranpli privacy policy URL, App Privacy (email, name, user content), screenshots
  (6.7" ak 6.5"), kont demo nan "App Review Information".

## 3. Risk revizyon yo (li sa!)
- **Apple 4.2 (fonksyonalite minimòm):** yon sit web ki anbale tou senp ka rejte. Pwen pou ou:
  eskanè kòd-baf natif (kamera), kont/sekirite, fonksyon biznis konplè. Si Apple rejte, ajoute
  yon fonksyon natif (notifikasyon push, eskanè ML Kit) epi re-soumèt.
- **Apple 3.1.1 / 3.1.3(c) (peman):** abònman an peye deyò app la (ou jere l manyèlman) e kont yo
  kreye pa administratè — pa gen peman nan app la, kidonk pa gen IAP. **Pa mete bouton peman
  oswa lyen pou peye abònman an andedan app iOS la**, sinon Apple ap egzije In-App Purchase.
  Dekri sa klè nan notes revizyon an: "B2B tool; accounts provisioned by administrator".
- Fonksyon **Abònman** (Netflix/IPTV) ak kontni streaming: verifye ke ou pa vann kontni ilegal;
  Apple/Google ka rejte sa. Dekri l kòm "swivi kliyan abònman", pa distribisyon kontni.
- **Telechajman PDF faktiti** nan WebView: teste sou vrè telefòn (iOS ka bezwen louvri nan Safari/Share).
- Teste: login, kamera (kòd-baf), foto pwodwi, WhatsApp link, mòd sombre, rotasyon.

## 4. Mizajou
- Chanjman web (UI, API) → `git push` → Vercel → mobil la ajou otomatikman.
- Chanjman natif (ikòn, pèmisyon, plugin) → `npx cap sync` → nouvo build → soumèt ankò. Monte `versionCode`/`CFBundleVersion`.
