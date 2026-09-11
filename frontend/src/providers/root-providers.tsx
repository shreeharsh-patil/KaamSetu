"use client";

import type { ReactNode } from "react";
import { QueryProvider } from "./query-provider";
import { ThemeProvider } from "./theme-provider";
import { NetworkProvider } from "./network-provider";
import { AuthProvider } from "@/features/auth/auth-context";
import { TooltipProvider } from "@/components/ui/tooltip";

export function RootProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider defaultTheme="light">
      <QueryProvider>
        <NetworkProvider>
          <AuthProvider>
            <TooltipProvider delayDuration={200}>
              {children}
            </TooltipProvider>
          </AuthProvider>
        </NetworkProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
