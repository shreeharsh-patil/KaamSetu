export function captureException(
  error: unknown,
  context?: Record<string, unknown>
): void {
  // Redact any phone numbers or auth tokens before transmitting
  const sanitizedContext: Record<string, unknown> = {};

  if (context) {
    for (const [key, value] of Object.entries(context)) {
      if (
        key.toLowerCase().includes("phone") ||
        key.toLowerCase().includes("token") ||
        key.toLowerCase().includes("otp") ||
        key.toLowerCase().includes("auth")
      ) {
        sanitizedContext[key] = "[REDACTED]";
      } else {
        sanitizedContext[key] = value;
      }
    }
  }

  if (process.env.NODE_ENV !== "production") {
    console.error("[ErrorTracker] Captured exception:", error, sanitizedContext);
  } else {
    // Sentry / error reporter hook
    try {
      if (
        typeof window !== "undefined" &&
        (window as unknown as { Sentry?: { captureException: Function } }).Sentry
      ) {
        (window as unknown as { Sentry: { captureException: Function } }).Sentry.captureException(
          error,
          { extra: sanitizedContext }
        );
      }
    } catch {
      // Ignore monitoring failures
    }
  }
}
