"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Briefcase } from "lucide-react";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { useAuth } from "@/features/auth/use-auth";

import { GradientBar } from "@/components/landing/gradient-bar";
import { Hero } from "@/components/landing/hero";
import { FeaturedServices } from "@/components/landing/featured-services";
import { HowItWorks } from "@/components/landing/how-it-works";
import { ClientLogos } from "@/components/landing/client-logos";
import { Testimonials } from "@/components/landing/testimonials";
import { TrustGuarantees } from "@/components/landing/trust-guarantees";
import { Insights } from "@/components/landing/insights";
import { FinalCTA } from "@/components/landing/final-cta";
import { WorkerLeadBoard } from "@/components/landing/worker-lead-board";

export default function HomePage() {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const [activeRole, setActiveRole] = useState<"customer" | "worker">("customer");

  // Redirect admins to admin dashboard
  useEffect(() => {
    if (isAuthenticated && user?.role === "admin") {
      router.replace("/admin");
    }
  }, [isAuthenticated, user, router]);

  // Set initial role view based on worker authentication
  useEffect(() => {
    if (isAuthenticated && user?.role === "worker") {
      setActiveRole("worker");
    }
  }, [isAuthenticated, user]);

  // Don't render while redirecting admins
  if (isAuthenticated && user?.role === "admin") {
    return null;
  }

  return (
    <div className="w-full flex flex-col items-center">
      {/* Subtle floating animated gradient bar */}
      <GradientBar />

      {/* Role Switcher Pill pinned near the top of the content */}
      <div className="pt-6 sm:pt-8 flex justify-center px-4 relative z-20 w-full">
        <div className="inline-flex p-1 rounded-full bg-secondary/80 backdrop-blur-md border border-border shadow-xs">
          <button
            type="button"
            onClick={() => setActiveRole("customer")}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
              activeRole === "customer"
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>{t("home.roleHire", "Hire Workers (Customer)")}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveRole("worker")}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
              activeRole === "worker"
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Briefcase className="h-4 w-4" />
            <span>{t("home.roleEarn", "Find Jobs & Earn (Worker)")}</span>
          </button>
        </div>
      </div>

      <div className="w-full flex flex-col">
        {/* Hero Section */}
        <Hero />

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
      </div>
    </div>
  );
}
