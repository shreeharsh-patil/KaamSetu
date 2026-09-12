import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for KaamSetu marketplace.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>

        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold">
            <Lock className="h-3.5 w-3.5" />
            <span>Data Protection & Privacy</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Privacy Policy
          </h1>
          <p className="text-sm text-muted-foreground">
            Last updated: September 2026
          </p>
        </div>

        <article className="prose dark:prose-invert max-w-none space-y-6 text-sm sm:text-base text-muted-foreground leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">1. Information We Collect</h2>
            <p>
              We collect information you provide directly, including your name, mobile phone number,
              email address, service location, and work preferences. We use this information solely
              to connect you with local service professionals or customers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">2. Phone Number & OTP Verification</h2>
            <p>
              Your phone number is used for account authentication and transactional SMS/WhatsApp
              notifications related to your service requests. We do not sell your personal data
              to third-party advertisers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">3. Location Data</h2>
            <p>
              With your permission, we process approximate geolocation to match service requests
              with nearby workers within a reasonable radius, reducing travel time and enabling fast response.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">4. Data Security</h2>
            <p>
              We implement industry-standard encryption, secure HTTP-only cookies, and role-based
              access controls to safeguard your account and transaction details.
            </p>
          </section>
        </article>
      </div>
    </main>
  );
}
