"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/feedback/error-state";

export default function GlobalFatalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Critical Root Layout Error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center p-4 bg-slate-50 text-slate-900 font-sans">
        <div className="w-full max-w-md">
          <ErrorState
            title="Critical Platform Error"
            message="A critical error occurred in the application root shell. Please try recovering below."
            digest={error.digest}
            onRetry={reset}
            actionText="Recover Application"
          />
        </div>
      </body>
    </html>
  );
}
