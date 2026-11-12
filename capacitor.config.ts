import type { CapacitorConfig } from "@capacitor/cli";

// URL piblik app la sou Vercel (dwe HTTPS). Chanje li anvan `npx cap sync`:
//   APP_URL=https://non-ou.vercel.app npx cap sync
const APP_URL = process.env.APP_URL || "https://CHANJE-MWEN.vercel.app";

const config: CapacitorConfig = {
  appId: "com.gadys.platfom", // PA JANM chanje apre premye piblikasyon an
  appName: "Platfomnou",
  webDir: "www", // sèlman paj "pa gen entènèt" — vrè app la chaje depi server.url
  server: {
    url: APP_URL,
    cleartext: false,
    allowNavigation: [new URL(APP_URL).hostname],
  },
  // limitsNavigationsToAppBoundDomains: nesesè pou service worker mache nan iOS (WKWebView)
  ios: { contentInset: "never", backgroundColor: "#111111", limitsNavigationsToAppBoundDomains: true },
  android: { backgroundColor: "#111111", allowMixedContent: false },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: "#FFFFFF",
      showSpinner: false,
    },
    StatusBar: { style: "DARK", backgroundColor: "#FFFFFF" },
  },
};

export default config;
