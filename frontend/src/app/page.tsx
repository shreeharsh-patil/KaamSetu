"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/use-auth";

import { Hero } from "@/components/landing/hero";
import { FeaturedServices } from "@/components/landing/featured-services";
import { HowItWorks } from "@/components/landing/how-it-works";
import { ClientLogos } from "@/components/landing/client-logos";
import { Testimonials } from "@/components/landing/testimonials";
import { TrustGuarantees } from "@/components/landing/trust-guarantees";
import { Insights } from "@/components/landing/insights";
import { FinalCTA } from "@/components/landing/final-cta";
import { WorkerLeadBoard } from "@/components/landing/worker-lead-board";
import { GradientBar } from "@/components/landing/gradient-bar";

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const [activeRole, setActiveRole] = useState<"customer" | "worker">("customer");

  // Redirect admins to admin dashboard
  useEffect(() => {
    if (isAuthenticated && (user?.role === "ADMIN" || user?.role === "SUPPORT")) {
      router.replace("/admin");
    }
  }, [isAuthenticated, user, router]);

  // Set initial role view based on worker authentication
  useEffect(() => {
    if (isAuthenticated && user?.role === "WORKER") {
      setActiveRole("worker");
    }
  }, [isAuthenticated, user]);

  // Don't render while redirecting admins
  if (isAuthenticated && (user?.role === "ADMIN" || user?.role === "SUPPORT")) {
    return null;
  }

  return (
    <>
      <main className="flex flex-col">
      {/* Hero Section */}
      <Hero activeRole={activeRole} onSelectRole={setActiveRole} />

      {/* Contextual role view switcher above the dynamic feed */}
      <div className="border-t border-border/60 bg-muted/20 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="text-muted-foreground font-medium">
            {activeRole === "customer"
              ? "Browsing as Customer: Instant booking & verified local services"
              : "Browsing as Worker: Live job feed & nearby service requests"}
          </span>
          <div className="inline-flex rounded-lg border border-border bg-background p-0.5">
            <button
              type="button"
              onClick={() => setActiveRole("customer")}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                activeRole === "customer"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Hire Workers
            </button>
            <button
              type="button"
              onClick={() => setActiveRole("worker")}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                activeRole === "worker"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Find Work (Leads)
            </button>
          </div>
        </div>
      </div>

        {activeRole === "customer" ? (
          <>
            {/* Selected Work / Services with sticky stack */}
            <FeaturedServices />

            {/* Platform Credentials & How it Works */}
            <HowItWorks />

            {/* Trusted Infrastructure Marquee */}
            <ClientLogos />

            {/* Customer & Technician Testimonials */}
            <Testimonials />

            {/* Ironclad Guarantees */}
            <TrustGuarantees />

            {/* Insights & Field Reports */}
            <Insights />

            {/* Final Call to Action */}
            <FinalCTA />
          </>
        ) : (
          <>
            {/* Live Open Leads Feed for Technicians */}
            <WorkerLeadBoard />

            {/* How Worker Payouts & Escrow Work */}
            <HowItWorks />

            {/* Platform Guarantees */}
            <TrustGuarantees />

            {/* Worker Reviews & Stories */}
            <Testimonials />

            {/* Final CTA */}
            <FinalCTA />
          </>
        )}
      </main>
      <GradientBar />
    </>
  );
}
