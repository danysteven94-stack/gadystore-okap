# Notifikasyon push (vant, kòmand, stok ba...)

Chak fwa gen yon **vant**, yon **kòmand sou entènèt** (boutik piblik), yon **kòmand pèsonalize**, stok ba, depans enpòtan,
retounen pwodwi oswa nouvo kliyan, tout moun ki gen aksè nan antrepriz la resevwa yon notifikasyon sou telefòn/laptop.
Moun ki fè vant lan (kesye) pa resevwa notifikasyon pwòp vant li.

## 1. Laptop + telefòn atravè navigatè (Web Push) — 5 minit
1. Jenere kle VAPID sou òdinatè ou: `npx web-push generate-vapid-keys`
2. Sou Vercel → Environment Variables, ajoute: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` (sekrè!), `VAPID_SUBJECT` (`mailto:imèl-ou`). Redeploy.
3. Louvri app la, nan meni an (sidebar sou laptop, "Plis" sou telefòn) klike **Aktive notifikasyon** → Aksepte.
   Klike **Teste notifikasyon** pou verifye. Fè sa sou chak aparèy.
- Chrome/Edge/Firefox (laptop) ✔ · Android Chrome ✔ · Safari Mac ✔
- **iPhone/iPad (navigatè):** mache sèlman si ou enstale app la sou ekran dakèy (Pataje → Ajoute sou ekran dakèy), iOS 16.4+.

## 2. App natif (Play Store / App Store) — Firebase
Web Push pa mache andedan app natif la; li itilize Firebase Cloud Messaging (FCM).
1. https://console.firebase.google.com → kreye yon pwojè → ajoute app **Android** (`com.gadys.platfom`) ak app **iOS** (menm bundle ID).
2. Telechaje `google-services.json` → mete l nan `android/app/`. Telechaje `GoogleService-Info.plist` → mete l nan `ios/App/App/` (Xcode: Add Files).
3. **iOS:** Apple Developer → Keys → kreye yon **APNs Auth Key (.p8)** → Firebase → Project Settings → Cloud Messaging → upload li.
   Xcode → Signing & Capabilities → ajoute **Push Notifications** ak **Background Modes → Remote notifications**.
4. Firebase → Project Settings → Service accounts → **Generate new private key** → kopye tout JSON an (yon sèl liy) nan varyab Vercel
   `FIREBASE_SERVICE_ACCOUNT`. Redeploy.
5. `npm install && npx cap sync`, rebuild app la, epi aktive notifikasyon nan meni an.
(Script `mobile-setup.sh` deja ajoute pèmisyon `POST_NOTIFICATIONS` pou Android 13+.)

## Pwoblèm komen
- "Sèvè a poko konfigire" → VAPID_PUBLIC_KEY manke sou Vercel (oswa pa t redeploye).
- Teste di "pa gen aparèy ki resevwa" → kle VAPID yo pa kòrèk, oswa abònman an vini ekspire: dezaktive epi reaktive.
- "Notifikasyon bloke" → navigatè/telefòn nan refize; chanje sa nan paramèt sit la / app la.
- Notifikasyon yo pati lè sèvè a resevwa evènman an: yon vant offline voye notifikasyon lè l senkronize.
