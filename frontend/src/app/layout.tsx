import type { Metadata, Viewport } from "next";
import { Inter_Tight } from "next/font/google";
import "@/styles/globals.css";
import { siteConfig } from "@/config/site";
import { RootProviders } from "@/providers/root-providers";
import { AppHeader } from "@/components/layout/app-header";
import { AppFooter } from "@/components/layout/app-footer";
import { OfflineBanner } from "@/components/feedback/offline-banner";
import { VoiceAssistantFAB } from "@/components/voice/voice-assistant-fab";
import { MagneticCursor } from "@/components/ui/magnetic-cursor";

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  manifest: "/site.webmanifest",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: siteConfig.url,
    title: siteConfig.title,
    description: siteConfig.description,
    siteName: siteConfig.name,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={interTight.variable}>
      <body className={`${interTight.className} font-sans antialiased min-h-screen flex flex-col bg-background text-foreground selection:bg-blue-500/20`}>
        <MagneticCursor />

        {/* Accessible Skip Link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:outline-none"
        >
          Skip to main content
        </a>

        <RootProviders>
          <AppHeader />
          <OfflineBanner />
          <main id="main-content" className="flex-1 flex flex-col">
            {children}
          </main>
          <VoiceAssistantFAB />
          <AppFooter />
        </RootProviders>
      </body>
    </html>
  );
}
