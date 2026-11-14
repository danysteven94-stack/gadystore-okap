# Boutik piblik (e-commerce) — `/boutik/[slug]`

## Paj yo
| URL | Sa li fè |
|---|---|
| `/boutik/{slug}` | Dakèy: hero, kategori, Vedèt / Promosyon / Nouvo / Pi vann, tout pwodwi ak rechèch, filt, triye |
| `/boutik/{slug}?q=…` `?cat=…` `?sale=1` | Rezilta rechèch / kategori / promosyon |
| `/boutik/{slug}/p/{id}` | Paj pwodwi: galri, rabè, kantite, avi, pwodwi sanblab, SEO (Open Graph + JSON-LD) |
| `/boutik/{slug}/checkout` | Livrezon oswa ranmase, peman (MonCash/NatCash/transfè/kach), kòd promosyon |
| `/boutik/{slug}/track` | Swivi kòmand ak kòd + telefòn (etap: resevwa → konfime → prepare → nan wout → livre) |
| `/boutik/{slug}/wishlist` | Favori (sove sou aparèy kliyan an) |
| `/boutik/{slug}/about` | Livrezon, peman, politik retou, kontak |

## Sa ki nan dashboard
- **Gwosè ak koulè** (`sizes`, `colors`, separe ak vigil): kliyan an dwe chwazi yo sou paj pwodwi a; panye, checkout, kòmand ak swivi montre yo. Stok la pataje ant tout varyant yon pwodwi.
- **Pwodwi**: ansyen pri (rabè), mak, plizyè foto (jiska 5), vedèt.
- **Boutik (`/shop`)**: bann anons, livrezon/ranmase, frè livrezon, livrezon gratis depi X, adrès, orè, politik retou, Facebook/Instagram, **kòd promosyon**.
- **Kòmand (`/orders`)**: chanje etap livrezon (kliyan an wè l nan swivi) + bouton WhatsApp pou voye nouvèl.

## Sekirite
- Pri, rabè koupon ak livrezon kalkile **sèvè a** (`priceCart` nan `src/lib/shop.ts`), jamè navigatè a.
- Stok rezève atomikman; limit pa IP sou kòmand, swivi, avi, koupon.
- Swivi kòmand mande kòd **ak** telefòn; avi sèlman pou achtè ki gen kòd kòmand + telefòn (1 avi pou chak kòmand/pwodwi).
- Pri acha, stok minimòm ak kòd ba pa janm parèt piblikman.

## Nouvo kle Redis
`coupon:{businessId}:{CODE}`, `business:{id}:coupons`, `shop:ordercode:{businessId}:{CODE}`, `product:{id}:reviews`, `review:done:{orderId}:{productId}`.
Chan pwodwi ajoute: `comparePrice, brand, images, featured, createdAt, sold, ratingSum, ratingCount`.

## Poko fè (pwochen etap posib)
Peman otomatik MonCash/Stripe (kounye a peman an manyèl), kont kliyan (login), tradiksyon fr/en sou vitrin nan.
