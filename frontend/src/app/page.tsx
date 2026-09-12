"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/use-auth";

import { GradientBar } from "@/components/landing/gradient-bar";
import { Hero } from "@/components/landing/hero";
import { FeaturedServices } from "@/components/landing/featured-services";
import { ClientLogos } from "@/components/landing/client-logos";
import { WorkerLeadBoard } from "@/components/landing/worker-lead-board";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Testimonials } from "@/components/landing/testimonials";
import { TrustGuarantees } from "@/components/landing/trust-guarantees";
import { Insights } from "@/components/landing/insights";
import { FinalCTA } from "@/components/landing/final-cta";

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  // Redirect admins to admin dashboard
  useEffect(() => {
    if (isAuthenticated && (user?.role === "ADMIN" || user?.role === "SUPPORT")) {
      router.replace("/admin");
    }
  }, [isAuthenticated, user, router]);

  // Don't render while redirecting admins
  if (isAuthenticated && (user?.role === "ADMIN" || user?.role === "SUPPORT")) {
    return null;
  }

  return (
    <>
      {/* Floating scroll indicator gradient bar from ai-product-portfolio */}
      <GradientBar />

      <div className="flex flex-col">
        {/* Hero Section with scroll-linked reveal */}
        <Hero />

        {/* Stacked Sticky Work Cards on Scroll */}
        <FeaturedServices />

        {/* Partners & Infrastructure Marquee Scroll Animation */}
        <ClientLogos />

        {/* Genuine Trade Opportunities & Fare Benchmarks for Technicians */}
        <WorkerLeadBoard />

        {/* Clear 3-Step Workflows for Customers & Workers */}
        <HowItWorks />

        {/* Double Infinite Scroll Testimonials Ticker */}
        <Testimonials />

        {/* Factual Platform Standards & Safety Guarantees */}
        <TrustGuarantees />

        {/* Platform Insights & Field Reports */}
        <Insights />

        {/* Direct Call to Action with Scroll-Revealed Title */}
        <FinalCTA />
      </div>
    </>
  );
}
