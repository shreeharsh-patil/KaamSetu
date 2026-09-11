"use client";

import type { ReactNode } from "react";
import { QueryProvider } from "./query-provider";
import { ThemeProvider } from "./theme-provider";
import { NetworkProvider } from "./network-provider";

export function RootProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider defaultTheme="light">
      <QueryProvider>
        <NetworkProvider>{children}</NetworkProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
