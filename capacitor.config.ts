import type { CapacitorConfig } from "@capacitor/cli";

// URL piblik app la sou Vercel (dwe HTTPS). Chanje li anvan `npx cap sync`:
//   APP_URL=https://non-ou.vercel.app npx cap sync
const APP_URL = process.env.APP_URL || "https://CHANJE-MWEN.vercel.app";

// Mòd "app boutik": yon app natif ki louvri DIRÈK boutik yon sèl biznis (pwòp logo, pwòp non).
//   SHOP_SLUG=boutik-mwen APP_ID=com.boutikmwen.app APP_NAME="Boutik Mwen" APP_URL=https://... npx cap sync
// Gade SHOP-APP.md. San SHOP_SLUG, se app jesyon Platfomnou an ki bati (konpòtman orijinal).
const SHOP_SLUG = process.env.SHOP_SLUG;
const START_URL = SHOP_SLUG ? `${APP_URL.replace(/\/$/, "")}/boutik/${SHOP_SLUG}` : APP_URL;

const config: CapacitorConfig = {
  appId: process.env.APP_ID || "com.gadys.platfom", // PA JANM chanje apre premye piblikasyon an
  appName: process.env.APP_NAME || "Platfomnou",
  webDir: "www", // sèlman paj "pa gen entènèt" — vrè app la chaje depi server.url
  server: {
    url: START_URL,
    cleartext: false,
    allowNavigation: [new URL(APP_URL).hostname],
  },
  // limitsNavigationsToAppBoundDomains: nesesè pou service worker mache nan iOS (WKWebView)
  ios: { contentInset: "never", backgroundColor: "#111111", limitsNavigationsToAppBoundDomains: true },
  android: { backgroundColor: "#111111", allowMixedContent: false, webContentsDebuggingEnabled: false },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: "#FFFFFF",
      showSpinner: false,
    },
    FirebaseMessaging: { presentationOptions: ["badge", "sound", "alert"] },
    StatusBar: { style: "DARK", backgroundColor: "#FFFFFF" },
  },
};

export default config;
