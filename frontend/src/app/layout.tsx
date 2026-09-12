import type { Metadata, Viewport } from "next";
import { Inter_Tight } from "next/font/google";
import "@/styles/globals.css";
import { siteConfig } from "@/config/site";
import { RootProviders } from "@/providers/root-providers";
import { AppHeader } from "@/components/layout/app-header";
import { OfflineBanner } from "@/components/feedback/offline-banner";
import { VoiceAssistantFAB } from "@/components/voice/voice-assistant-fab";
import { ConditionalFooter } from "@/components/layout/conditional-footer";

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
    icon: "/icon.png",
    apple: "/brand-logo.png",
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
      <body
        className={`${interTight.className} font-sans antialiased min-h-screen flex flex-col bg-background text-foreground selection:bg-blue-500/20`}
      >
        {/* Accessible Skip Link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:outline-none"
        >
          Skip to main content
        </a>

        <RootProviders>
          {/*
            AppHeader hides itself on authenticated dashboard routes.
            DashboardShell renders its own sidebar + compact topbar for those.
          */}
          <AppHeader />
          <OfflineBanner />
          <main id="main-content" className="flex-1 flex flex-col">
            {children}
          </main>
          <VoiceAssistantFAB />
          {/*
            ConditionalFooter hides AppFooter on authenticated dashboard pages.
            Marketing/public pages still get the full footer.
          */}
          <ConditionalFooter />
        </RootProviders>
      </body>
    </html>
  );
}
