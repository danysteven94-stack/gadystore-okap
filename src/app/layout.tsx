import type { Metadata, Viewport } from "next";
import { Manrope, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { LanguageProvider } from "@/lib/i18n/language-provider";
import { AppChrome } from "@/components/nav/app-chrome";
import { ViewportLock } from "@/components/providers/viewport-lock";
import { OfflineProvider } from "@/components/providers/offline-provider";

const sans = Manrope({ subsets: ["latin"], variable: "--font-sans", weight: ["400", "500", "600", "700", "800"] });
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Platfomnou — Gestion multi-entreprises",
  description: "Ventes, stocks, factures et rapports en temps réel.",
  manifest: "/manifest.webmanifest",
  applicationName: "Platfomnou",
  appleWebApp: { capable: true, title: "Platfomnou", statusBarStyle: "black-translucent" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  maximumScale: 1, // pa gen zoom: app la rete stab sou telefòn
  userScalable: false,
  themeColor: "#111111",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${sans.variable} ${mono.variable} font-sans bg-canvas text-ink dark:bg-dark-bg dark:text-white antialiased transition-colors`}
      >
        <ViewportLock />
        <ThemeProvider>
          <LanguageProvider>
            <OfflineProvider>
              <AppChrome>{children}</AppChrome>
            </OfflineProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
