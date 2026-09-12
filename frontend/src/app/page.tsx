"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/use-auth";

import { Hero } from "@/components/landing/hero";
import { FeaturedServices } from "@/components/landing/featured-services";
import { HowItWorks } from "@/components/landing/how-it-works";
import { TrustGuarantees } from "@/components/landing/trust-guarantees";
import { FinalCTA } from "@/components/landing/final-cta";
import { WorkerLeadBoard } from "@/components/landing/worker-lead-board";

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
    <div className="flex flex-col">
      {/* Hero Section */}
      <Hero />

      {/* Real Platform Categories from Backend API */}
      <FeaturedServices />

      {/* Genuine Trade Opportunities & Fare Benchmarks for Technicians */}
      <WorkerLeadBoard />

      {/* Clear 3-Step Workflows for Customers & Workers */}
      <HowItWorks />

      {/* Factual Platform Standards & Safety Guarantees */}
      <TrustGuarantees />

      {/* Direct Call to Action */}
      <FinalCTA />
    </div>
  );
}
