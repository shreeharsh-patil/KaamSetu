"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { SectionTitle } from "@/components/landing/section-title";

const GUARANTEES = [
  {
    title: "100% Aadhaar & Police Verified Technicians",
    organization: "DigiLocker & Govt DB Identity Verification",
    badge: "Verified Trust",
    link: "/customer/jobs/new",
  },
  {
    title: "Automated Escrow Milestone Ledger",
    organization: "Funds securely held and released only with your 4-digit OTP",
    badge: "Zero Fraud",
    link: "/customer/jobs/new",
  },
  {
    title: "Standardized Upfront Rate Cards",
    organization: "Pre-agreed transparent pricing without unfair on-site surprises",
    badge: "Fair Price",
    link: "/customer/jobs/new",
  },
  {
    title: "Geospatial Multi-Ring Wave Dispatch",
    organization: "Dispatches nearest available pros for rapid <15m doorstep arrival",
    badge: "Under 15m",
    link: "/customer/jobs/new",
  },
  {
    title: "30-Day Workmanship Warranty Coverage",
    organization: "Complete re-inspection protection on plumbing, wiring and appliance repairs",
    badge: "Guaranteed",
    link: "/customer/jobs/new",
  },
];

export function TrustGuarantees() {
  return (
    <section id="guarantees" className="py-20 md:py-24 border-t border-border/60">
      <div className="max-w-[1280px] mx-auto px-6 md:px-12">
        {/* Section Header */}
        <div className="mb-12 md:mb-16">
          <span className="text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">
            Safety & Standards
          </span>
          <SectionTitle className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight mt-2">
            The 5 Ironclad Guarantees
          </SectionTitle>
        </div>

        {/* Guarantees List */}
        <div className="flex flex-col gap-4">
          {GUARANTEES.map((item, index) => (
            <Link
              key={index}
              href={item.link}
              className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 sm:p-7 border border-border rounded-2xl md:rounded-3xl bg-card/60 backdrop-blur-sm hover:bg-secondary/60 transition-all duration-200 hover:border-foreground/20 hover:shadow-lg"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 flex-1">
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 w-max">
                  {item.badge}
                </span>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg sm:text-xl md:text-2xl text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">{item.organization}</p>
                </div>
              </div>

              <div className="mt-4 sm:mt-0 flex items-center justify-end w-full sm:w-auto">
                <ArrowUpRight
                  className="w-7 h-7 sm:w-8 sm:h-8 text-muted-foreground transition-all duration-200 group-hover:translate-x-1 group-hover:-translate-y-1"
                  strokeWidth={1.75}
                  style={{ color: "#203eec" }}
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
