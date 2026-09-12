"use client";

import { SectionTitle } from "@/components/landing/section-title";
import { Mic, Radio, ShieldCheck } from "lucide-react";

const CAPABILITIES = [
  "Instant AI Dispatch",
  "Geospatial Wave Routing",
  "100% Aadhaar KYC",
  "Zero Middleman Cuts",
  "Automated Escrow Ledger",
  "Live GPS Tracking",
  "Direct UPI Settlements",
  "30-Day Service Guarantee",
  "Multi-Lingual Audio Prompts",
];

const PLATFORM_STATS = [
  { value: "< 15m", label: "Avg Doorstep Arrival" },
  { value: "50,000+", label: "Verified Jobs Completed" },
  { value: "4.94 ★", label: "Customer Satisfaction" },
];

const WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Post via Text or Voice Note",
    description:
      "State what broke in Hindi, Marathi, Kannada or English, or snap a photo. Our system parses the issue and locks an honest upfront rate card.",
    icon: Mic,
  },
  {
    step: "02",
    title: "Geospatial Wave Dispatch",
    description:
      "Real-time geospatial rings alert the top 5 nearest verified technicians simultaneously. The best-rated nearby pro accepts within 60 seconds.",
    icon: Radio,
  },
  {
    step: "03",
    title: "OTP Handshake & Escrow Release",
    description:
      "Track arrival on a live GPS map. Inspect the completed repair and verify with a secure 4-digit OTP. Funds release instantly to the pro's bank UPI.",
    icon: ShieldCheck,
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 md:py-24 border-t border-border/60">
      <div className="max-w-[1280px] mx-auto px-6 md:px-12">
        {/* Top Split: Mission & Credentials */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          {/* Left Column */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">
              The KaamSetu Standard
            </span>
            <SectionTitle className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight mt-2 text-balance">
              Bridging Skilled Hands with Homes That Need Them
            </SectionTitle>
            <p className="mt-6 text-muted-foreground leading-relaxed text-base sm:text-lg">
              Traditional urban service platforms extract 25-40% cuts from daily wage earners while charging
              inflated hidden rates to homeowners. KaamSetu replaces agency middlemen with an automated,
              transparent protocol.
            </p>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Every job is guaranteed by standardized market rate cards, background-checked Aadhaar verification,
              and tamper-proof escrow. Workers keep what they earn, and customers get honest, accountable service.
            </p>
          </div>

          {/* Right Column */}
          <div>
            {/* Expertise & System Features */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                Platform Architecture & Security
              </h3>
              <div className="flex flex-wrap gap-2">
                {CAPABILITIES.map((skill) => (
                  <span
                    key={skill}
                    className="px-4 py-2 text-xs sm:text-sm font-medium border border-border rounded-full bg-secondary/40 hover:bg-secondary transition-colors cursor-default"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Live Stats */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-10">
              {PLATFORM_STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="text-center p-4 sm:p-5 bg-secondary/80 rounded-2xl border border-border/60"
                >
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
                    {stat.value}
                  </div>
                  <div className="text-[11px] sm:text-xs text-muted-foreground mt-1.5 font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Workflow: 3-Step Lifecycle Cards */}
        <div className="mt-20">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">
              Transparent Lifecycle
            </span>
            <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight mt-1">
              How a Booking Flows in 3 Simple Steps
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {WORKFLOW_STEPS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  className="p-6 md:p-8 rounded-2xl md:rounded-3xl border border-border bg-card transition-all duration-300 hover:shadow-lg hover:-translate-y-1 relative group"
                >
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-xs font-mono font-bold text-muted-foreground/60 px-3 py-1 rounded-full bg-secondary">
                      Step {item.step}
                    </span>
                    <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h4 className="text-lg font-semibold tracking-tight mb-2 text-foreground">
                    {item.title}
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
