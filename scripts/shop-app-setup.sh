#!/usr/bin/env bash
# Kreye yon APP NATIF (Android + iOS) pou BOUTIK yon sèl biznis, ak pwòp logo li.
# Fè l nan yon KOPI pwojè a (san dosye android/ ak ios/) — yon kopi pou chak boutik.
#
#   APP_URL=https://non-ou.vercel.app SHOP_SLUG=boutik-mwen \
#   APP_ID=com.boutikmwen.app APP_NAME="Boutik Mwen" bash scripts/shop-app-setup.sh
#
# Logo a pran otomatikman nan boutik la (/api/shop/{slug}/icon) — chanje logo a nan
# dashboard la anvan ou kouri script la.
set -euo pipefail
: "${APP_URL:?Mete APP_URL=https://... (URL Vercel ou)}"
: "${SHOP_SLUG:?Mete SHOP_SLUG=slug boutik la (ekz: boutik-mwen)}"
: "${APP_ID:?Mete APP_ID=com.nonw.boutik (inik pou chak app; PA JANM chanje apre piblikasyon)}"
: "${APP_NAME:?Mete APP_NAME=\"Non boutik la\" (non ki parèt sou telefòn nan)}"
export APP_URL SHOP_SLUG APP_ID APP_NAME

if [[ -d android || -d ios ]]; then
  echo "ERÈ: dosye android/ oswa ios/ egziste deja. Kopye pwojè a nan yon nouvo dosye (san android/ ak ios/) pou chak boutik." >&2
  exit 1
fi

BASE="${APP_URL%/}/api/shop/${SHOP_SLUG}/icon"
echo "→ Telechaje logo boutik la depi $BASE"
mkdir -p resources
curl -fsSL "$BASE?size=1024" -o resources/icon-only.png
curl -fsSL "$BASE?size=1024&kind=maskable" -o resources/icon-foreground.png
curl -fsSL "$BASE?size=2732&kind=splash" -o resources/splash.png
cp resources/splash.png resources/splash-dark.png
# resources/icon-background.png (blan) rete jan l ye a.

bash scripts/mobile-setup.sh
echo "Fini. App '$APP_NAME' ($APP_ID) louvri $APP_URL/boutik/$SHOP_SLUG"
echo "Android: npm run cap:android   |   iOS (Mac): npm run cap:ios"
