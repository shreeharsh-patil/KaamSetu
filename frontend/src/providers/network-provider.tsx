"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useOnlineStatus } from "@/hooks/use-online-status";

interface NetworkContextValue {
  isOnline: boolean;
}

const NetworkContext = createContext<NetworkContextValue>({ isOnline: true });

export function NetworkProvider({ children }: { children: ReactNode }) {
  const isOnline = useOnlineStatus();

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js")
        .catch(() => {
          // Ignore service worker registration failure in unsupported environments
        });
    }
  }, []);

  return (
    <NetworkContext.Provider value={{ isOnline }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork(): NetworkContextValue {
  return useContext(NetworkContext);
}
