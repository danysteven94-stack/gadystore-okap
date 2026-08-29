import type { Metadata } from "next";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { LanguageProvider } from "@/lib/i18n/language-provider";
import { AppChrome } from "@/components/nav/app-chrome";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600"],
});
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Gady's — Gestion multi-entreprises",
  description: "Ventes, stocks, factures et rapports en temps réel.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${display.variable} ${sans.variable} ${mono.variable} font-sans bg-paper text-ink dark:bg-dark-bg dark:text-paper antialiased transition-colors`}
      >
        <ThemeProvider>
          <LanguageProvider>
            <AppChrome>{children}</AppChrome>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
