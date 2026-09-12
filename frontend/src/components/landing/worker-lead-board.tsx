"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionTitle } from "@/components/landing/section-title";

const WORKER_CATEGORIES = [
  { id: "all", label: "All Trades" },
  { id: "electrical", label: "Electrical" },
  { id: "plumbing", label: "Plumbing" },
  { id: "carpentry", label: "Carpentry" },
  { id: "appliances", label: "Appliances" },
  { id: "painting", label: "Painting" },
];

const TRADE_OPPORTUNITIES = [
  {
    id: "trade-electrical",
    title: "Electrical Maintenance & Repair",
    category: "electrical",
    categoryLabel: "Electrical",
    description: "Short circuits, wiring replacements, switchboards, MCB repairs, and inverter setups.",
    fareBenchmark: "₹350 - ₹850 / task",
    averageDuration: "1 - 2 hours",
    skills: ["Circuit Diagnostics", "Wiring", "Switchgear"],
  },
  {
    id: "trade-plumbing",
    title: "Plumbing & Sanitary Installations",
    category: "plumbing",
    categoryLabel: "Plumbing",
    description: "Leak repairs, pipe replacement, tap & flush tank fittings, drainage clearing.",
    fareBenchmark: "₹300 - ₹750 / task",
    averageDuration: "45 - 90 mins",
    skills: ["Pipe Fitting", "Drain Clearing", "Pressure Testing"],
  },
  {
    id: "trade-carpentry",
    title: "Carpentry & Furniture Assembly",
    category: "carpentry",
    categoryLabel: "Carpentry",
    description: "Door lock fixing, hinge adjustment, custom cabinetry repair, modular furniture setup.",
    fareBenchmark: "₹450 - ₹1,200 / task",
    averageDuration: "1 - 3 hours",
    skills: ["Lock Fitting", "Joinery", "Laminate Repair"],
  },
  {
    id: "trade-appliances",
    title: "Appliance Repair & Servicing",
    category: "appliances",
    categoryLabel: "Appliances",
    description: "AC filter cleaning, refrigerator gas recharge, washing machine motor repair.",
    fareBenchmark: "₹600 - ₹1,800 / task",
    averageDuration: "1 - 2 hours",
    skills: ["Cooling Systems", "Motor Repair", "PCB Inspection"],
  },
  {
    id: "trade-painting",
    title: "Painting & Wall Touchups",
    category: "painting",
    categoryLabel: "Painting",
    description: "Waterproofing patchup, single-room repaints, moisture sealing, exterior touchups.",
    fareBenchmark: "₹800 - ₹2,500 / task",
    averageDuration: "Half day / full day",
    skills: ["Surface Prep", "Waterproofing", "Roll Painting"],
  },
];

export function WorkerLeadBoard() {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredOpportunities = TRADE_OPPORTUNITIES.filter((item) => {
    return selectedCategory === "all" || item.category === selectedCategory;
  });

  return (
    <section id="worker-leads" className="py-16 md:py-24 border-t border-border/60 bg-muted/20">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              Direct Work Opportunities
            </div>
            <SectionTitle className="text-3xl sm:text-4xl font-semibold tracking-tight">
              Earn With Every Verified Job
            </SectionTitle>
            <p className="text-muted-foreground text-sm mt-2">
              Fair rate benchmarks, transparent platform fees, and authorized ledger payouts upon completion.
            </p>
          </div>

          <Link
            href="/worker"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-all shadow-md hover:shadow-lg"
            style={{
              background: "linear-gradient(135deg, #162044 0%, #203eec 100%)",
            }}
          >
            <span>Open Worker Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide mb-8">
          {WORKER_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                selectedCategory === cat.id
                  ? "bg-foreground text-background shadow-sm"
                  : "bg-secondary text-muted-foreground hover:text-foreground border border-border"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Trade Opportunities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOpportunities.map((trade) => (
            <article
              key={trade.id}
              className="p-4 xs:p-6 rounded-2xl md:rounded-3xl border border-border bg-card hover:border-foreground/20 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                    {trade.categoryLabel}
                  </span>
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {trade.averageDuration}
                  </span>
                </div>

                <h3 className="font-semibold text-lg text-foreground mb-2 leading-snug">
                  {trade.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                  {trade.description}
                </p>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {trade.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-0.5 rounded-md bg-muted text-[11px] text-muted-foreground"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border/70 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-muted-foreground block">Typical Fare Benchmark</span>
                  <span className="text-base font-bold text-foreground">
                    {trade.fareBenchmark}
                  </span>
                </div>

                <Link
                  href="/worker"
                  className="px-4 py-2 rounded-full text-xs font-semibold text-white transition-transform hover:scale-105"
                  style={{
                    background: "linear-gradient(135deg, #162044 0%, #203eec 100%)",
                  }}
                >
                  View Offers
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
