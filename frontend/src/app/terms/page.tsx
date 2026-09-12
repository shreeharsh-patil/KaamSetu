import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for using KaamSetu marketplace.",
};

export default function TermsPage() {
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
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Legal & Marketplace Terms</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Terms of Service
          </h1>
          <p className="text-sm text-muted-foreground">
            Last updated: September 2026
          </p>
        </div>

        <article className="prose dark:prose-invert max-w-none space-y-6 text-sm sm:text-base text-muted-foreground leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">1. Marketplace Platform</h2>
            <p>
              KaamSetu operates a hyperlocal service marketplace connecting independent service
              professionals (&quot;Workers&quot;) with individuals seeking domestic and technical
              services (&quot;Customers&quot;). KaamSetu provides the technology platform, matching
              algorithms, and payment facilitation.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">2. User Accounts & Verification</h2>
            <p>
              Users must provide authentic and accurate phone numbers and personal details.
              Workers undergo identity, trade verification, and background checks prior to taking on
              marketplace assignments. Accounts are verified using one-time verification codes.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">3. Fair Pricing & Payments</h2>
            <p>
              Service quotes and rates are established transparently before work commences.
              Payment escrow and completion verification are enforced through start and completion
              verification codes.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">4. Safety & Conduct</h2>
            <p>
              Both customers and service workers agree to treat each other with dignity and
              respect. Harassment, abuse, or refusal to abide by platform safety standards will
              result in immediate termination of account access.
            </p>
          </section>
        </article>
      </div>
    </main>
  );
}
