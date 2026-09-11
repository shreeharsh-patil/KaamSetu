"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect, type ReactNode } from "react";
import { ApiError } from "@/lib/api/errors";
import { setupSocketQuerySync, connectSocket } from "@/lib/socket/socket-client";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            gcTime: 5 * 60 * 1000,
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              // Never retry client-side validation errors, 401s, 403s, or 404s
              if (error instanceof ApiError) {
                if (
                  error.isUnauthorized() ||
                  error.isForbidden() ||
                  error.isNotFound() ||
                  error.isValidationError()
                ) {
                  return false;
                }
              }
              // Allow at most 2 retries for transient network/server glitches
              return failureCount < 2;
            },
          },
          mutations: {
            // Never retry mutations blindly (avoid duplicate job creations or payment attempts)
            retry: false,
          },
        },
      })
  );

  useEffect(() => {
    connectSocket();
    const cleanup = setupSocketQuerySync(queryClient);
    return () => {
      cleanup();
    };
  }, [queryClient]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
