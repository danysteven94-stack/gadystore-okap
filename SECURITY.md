# Sekirite — Platfomnou

## Verite sou "kache kòd la"
- **Kòd ki kouri nan navigatè/telefòn nan (JavaScript front-end) pa ka kache nèt.** Nenpòt moun ka louvri DevTools
  oswa dekonpile yon APK. Obfuscation sèlman ralanti moun; li pa bloke.
- Sa ki pwoteje biznis ou se: **lojik ak done sou sèvè a** (API + Upstash). Kòd sèvè a pa janm voye bay kliyan.
- Se poutèt sa mwen mete efò sou: aksè done (chak antrepriz izole), limit eseye, headers, ak depo kòd prive.

## Sa ki fèt nan kòd la
- Chak route API ki gen `businessId` verifye kounye a ke antrepriz la se pa itilizatè a (anvan, nenpòt moun konekte te ka li/ekri
  done yon lòt antrepriz si l te konnen ID a). Backup, notifikasyon, kliyan, founisè, abònman, kòmand yo kouvri.
- Login: max 20 eseye/15 min pa IP ak 8 pa imèl (429 apre sa). Efase kont: 5 eseye/15 min.
- Headers: HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy (kamera sèlman).
- Pa gen source maps piblik, pa gen `X-Powered-By`, `console.log` retire an pwodiksyon.
- `JWT_SECRET` obligatwa; erè login pa fuite detay entèn.
- Android release: R8 minify/obfuscation, `allowBackup=false`, debug WebView dezaktive. iOS: pa gen inspeksyon an App Store build.

## Sa ou dwe fè (pa kapab fèt nan kòd)
1. **GitHub:** depo a dwe **Private** (Settings → Danger Zone → Change visibility). Aktive 2FA sou GitHub, Vercel ak Upstash.
2. **Pa janm komite `.env`.** Si yon fwa li te nan GitHub (menm si efase), **chanje** `JWT_SECRET`, token Upstash ak `CRON_SECRET`
   (Upstash → Reset token; Vercel → Environment Variables).
3. **Vercel:** Settings → Deployment Protection → mete Preview deployments dèyè login. Make varyab sekrè yo "Sensitive".
4. **Upstash:** pa pataje URL/token REST; aktive IP allowlist si plan ou pèmèt.
5. **Keystore Android** (`.jks`) ak modpas li: sove yo an sekirite, pa nan GitHub.
6. Chanje modpas admin yo, epi pa kite modpas tanporè yo.

## Limit koni (pwochen etap posib)
- Pa gen CSP (Content-Security-Policy) — li mande nonces pou Next.js; ajoute apre tès konplè.
- Anplwaye (jesyonè/kesye) kòmanse san okenn antrepriz. Administratè ki kreye yo asiyen antrepriz li yo nan
  **Itilizatè → Antrepriz**. Yon administratè pa ka bay aksè a yon antrepriz ki pa pa l, ni asiyen lòt administratè.
- Done offline sou telefòn (IndexedDB) pa chifre; yo nan sandbox app la.
- `SUPER_ADMIN_EMAIL` gen yon valè default nan kòd la; mete l kòrèkteman sou Vercel.
