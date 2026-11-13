#!/usr/bin/env bash
# Kreye pwojè natif Android + iOS (fè l yon sèl fwa).
# Itilizasyon:  APP_URL=https://non-ou.vercel.app bash scripts/mobile-setup.sh
set -euo pipefail
: "${APP_URL:?Mete APP_URL=https://... (URL Vercel ou)}"

npm install
npx cap add android || true
[[ "$(uname)" == "Darwin" ]] && (npx cap add ios || true)

# Ikòn + splash soti nan resources/
mkdir -p assets && cp resources/icon-only.png resources/icon-foreground.png resources/icon-background.png \
  resources/splash.png resources/splash-dark.png assets/
npm run cap:assets

# Android: pèmisyon kamera (eskane kòd-baf)
MANIFEST=android/app/src/main/AndroidManifest.xml
if ! grep -q "android.permission.CAMERA" "$MANIFEST"; then
  sed -i 's#<uses-permission android:name="android.permission.INTERNET" />#&\n    <uses-permission android:name="android.permission.CAMERA" />\n    <uses-feature android:name="android.hardware.camera" android:required="false" />#' "$MANIFEST"
fi

# Android 13+: pèmisyon notifikasyon
if ! grep -q "POST_NOTIFICATIONS" "$MANIFEST"; then
  sed -i 's#<uses-permission android:name="android.permission.INTERNET" />#&\n    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />#' "$MANIFEST"
fi

# Android: obfuscation/minify (R8) nan release + pa kite backup ADB
sed -i 's/minifyEnabled false/minifyEnabled true\n            shrinkResources true/' android/app/build.gradle || true
sed -i 's/android:allowBackup="true"/android:allowBackup="false"/' "$MANIFEST" || true

# iOS: tèks pèmisyon kamera (obligatwa, sinon Apple rejte)
PLIST=ios/App/App/Info.plist
if [[ -f "$PLIST" ]]; then
  /usr/libexec/PlistBuddy -c "Add :NSCameraUsageDescription string 'Kamera a sèvi pou eskane kòd-baf pwodwi yo.'" "$PLIST" 2>/dev/null || true
  /usr/libexec/PlistBuddy -c "Add :NSPhotoLibraryUsageDescription string 'Chwazi foto pwodwi nan galri ou.'" "$PLIST" 2>/dev/null || true
  /usr/libexec/PlistBuddy -c "Add :ITSAppUsesNonExemptEncryption bool false" "$PLIST" 2>/dev/null || true
  # Mòd offline (service worker) nan iOS bezwen domèn app la deklare isit la
  HOST=$(echo "$APP_URL" | sed -E 's#https?://([^/]+).*#\1#')
  /usr/libexec/PlistBuddy -c "Delete :WKAppBoundDomains" "$PLIST" 2>/dev/null || true
  /usr/libexec/PlistBuddy -c "Add :WKAppBoundDomains array" "$PLIST"
  /usr/libexec/PlistBuddy -c "Add :WKAppBoundDomains:0 string $HOST" "$PLIST"
fi

npx cap sync
echo "Fini. Android: npm run cap:android   |   iOS (Mac): npm run cap:ios"
