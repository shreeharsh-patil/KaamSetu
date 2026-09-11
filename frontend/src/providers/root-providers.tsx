"use client";

import type { ReactNode } from "react";
import { QueryProvider } from "./query-provider";
import { ThemeProvider } from "./theme-provider";
import { NetworkProvider } from "./network-provider";
import { AuthProvider } from "@/features/auth/auth-context";
import { I18nProvider } from "@/lib/i18n/i18n-context";
import { TooltipProvider } from "@/components/ui/tooltip";

export function RootProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider defaultTheme="light">
      <QueryProvider>
        <NetworkProvider>
          <I18nProvider>
            <AuthProvider>
              <TooltipProvider delayDuration={200}>
                {children}
              </TooltipProvider>
            </AuthProvider>
          </I18nProvider>
        </NetworkProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
