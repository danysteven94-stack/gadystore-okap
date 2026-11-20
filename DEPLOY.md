# Platfomnou — Gid deplwaman

## 1. Varyab sou Vercel
`Settings → Environment Variables` (kite "Production" koche), epi **Redeploy** apre chak chanjman.

| Varyab | Obligatwa? | Kote pou jwenn li |
|---|---|---|
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | ✅ | console.upstash.com → baz done a → REST API |
| `JWT_SECRET` | ✅ | `openssl rand -base64 32` |
| `APP_URL` | ✅ | Lyen app la (`https://...vercel.app`) |
| `CRON_SECRET` | ✅ | `openssl rand -base64 32` (≥ 16 karaktè). San li, backup otomatik ak rapèl pa mache |
| `SUPER_ADMIN_EMAIL` | ✅ | Imèl kont prensipal la |
| `TOTP_ENCRYPTION_KEY` | rekòmande | `openssl rand -base64 32` — SOVE L |
| `GMAIL_USER` + `GMAIL_APP_PASSWORD` | pou "Mo de pas bliye" | myaccount.google.com/apppasswords |
| `RESEND_API_KEY` + `SEND_DOMAIN` | alternativ a Gmail | resend.com (bezwen domèn verifye) |
| `BLOB_READ_WRITE_TOKEN` | rekòmande | Vercel → Storage → Blob |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | opsyonèl | Imèl sipò (paj konfidansyalite) |
| `VAPID_*`, `FIREBASE_SERVICE_ACCOUNT`, `WHATSAPP_*` | opsyonèl | Push / app natif / WhatsApp |

Vercel Cron voye `CRON_SECRET` otomatikman (`Authorization: Bearer ...`) lè varyab la defini.

## 2. Premye deplwaman
1. `npm install`
2. `npm test` ak `npm run build`
3. Kreye kont prensipal: `npx tsx scripts/seed-admin.ts imèl@ou.com modpas` (nan `.env.local`: UPSTASH_*)
4. `git push` → Vercel bati otomatikman.

## 3. Foto sou Blob (si w te gen foto deja)
```
npm run migrate:images -- --dry   # wè sa ki pou deplase (pa chanje anyen)
npm run migrate:images            # vrè migrasyon (ka relanse san danje)
```

## 4. Tès
- `npm test` — tès inite (Vitest)
- `npx playwright install chromium` (yon fwa), epi `npm run build && npm run test:e2e`
- GitHub Actions (`.github/workflows/ci.yml`) woule tout sa a sou chak push.

## 5. Tcheke apre deplwaman
- Konekte → **Sekirite** → aktive 2FA (sove kòd rekiperasyon yo).
- "Mo de pas bliye" voye yon imèl (tcheke spam).
- **Jounal odit** montre koneksyon ou.
- Vercel → Cron Jobs: `/api/backup/cron` retounen `backedUp > 0` (apre premye 04:00 UTC, oswa "Run" manyèl).
- Kont caissier: pa ka modifye pwodwi.

## 6. Sekirite — rapèl
- Pa janm mete sekrè (`JWT_SECRET`, `GMAIL_APP_PASSWORD`...) nan GitHub — sèlman sou Vercel.
- `npm audit` regilyèman; Dependabot (`.github/dependabot.yml`) ouvri PR otomatik.
- Wòl: `admin` (tout), `gestionnaire` (pwodwi/stok/rapò), `caissier` (vant sèlman) — gade `src/lib/permissions.ts`.
