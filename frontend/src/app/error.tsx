"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/feedback/error-state";
import { Container } from "@/components/layout/container";

export default function GlobalErrorRoute({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log client error to monitoring service (Sentry, etc.)
    console.error("App Route Error caught:", error);
  }, [error]);

  return (
    <div className="flex-1 flex items-center justify-center py-16">
      <Container size="sm">
        <ErrorState
          title="Application Error"
          message={error.message || "An unexpected error occurred while rendering this page."}
          digest={error.digest}
          onRetry={reset}
          actionText="Reload Page"
        />
      </Container>
    </div>
  );
}
