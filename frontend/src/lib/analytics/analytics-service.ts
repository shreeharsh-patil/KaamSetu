export type AnalyticsEvent =
  | "signup_started"
  | "signup_completed"
  | "worker_onboarding_started"
  | "worker_onboarding_completed"
  | "job_creation_started"
  | "job_published"
  | "offer_opened"
  | "offer_accepted"
  | "offer_declined"
  | "job_started"
  | "job_completed"
  | "expense_added"
  | "review_submitted";

class AnalyticsService {
  private enabled: boolean;

  constructor() {
    this.enabled = typeof window !== "undefined" && process.env.NODE_ENV === "production";
  }

  track(event: AnalyticsEvent, properties?: Record<string, unknown>): void {
    if (!this.enabled) {
      if (process.env.NODE_ENV !== "production") {
        // Redact PII in dev logs
        const safeProps = { ...properties };
        delete safeProps.phone;
        delete safeProps.token;
        delete safeProps.address;
        console.warn(`[Analytics] ${event}`, safeProps);
      }
      return;
    }

    try {
      // Dispatch to telemetry/analytics endpoint or window provider if present
      if (typeof window !== "undefined" && (window as unknown as { gtag?: Function }).gtag) {
        (window as unknown as { gtag: Function }).gtag("event", event, properties);
      }
    } catch {
      // Silently fail to never disrupt user experience
    }
  }
}

export const analytics = new AnalyticsService();
