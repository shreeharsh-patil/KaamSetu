"use client";

import { WifiOff } from "lucide-react";
import { useNetwork } from "@/providers/network-provider";
import { Container } from "@/components/layout/container";

export function OfflineBanner() {
  const { isOnline } = useNetwork();

  if (isOnline) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="sticky top-16 z-30 w-full bg-amber-600 px-4 py-2.5 text-white shadow-md transition-all animate-in slide-in-from-top duration-200"
    >
      <Container className="flex items-center justify-center gap-2 text-xs sm:text-sm font-medium">
        <WifiOff className="h-4 w-4 shrink-0" />
        <span>
          You are currently offline. Actions will be queued and synchronized once connection is restored.
        </span>
      </Container>
    </div>
  );
}
