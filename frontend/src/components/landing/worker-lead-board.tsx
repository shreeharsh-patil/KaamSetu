"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, Clock, ArrowRight } from "lucide-react";
import { SectionTitle } from "@/components/landing/section-title";

const WORKER_CATEGORIES = [
  { id: "all", label: "All Trades" },
  { id: "electrical", label: "Electrical" },
  { id: "plumbing", label: "Plumbing" },
  { id: "carpentry", label: "Carpentry" },
  { id: "appliances", label: "Appliances" },
  { id: "painting", label: "Painting" },
];

const JOB_LEADS = [
  {
    id: "lead-101",
    title: "Tripping Main Circuit Breaker & Sparking",
    category: "electrical",
    categoryLabel: "Electrical",
    area: "Andheri West, Mumbai",
    distanceKm: 1.8,
    payoutMin: 450,
    payoutMax: 600,
    urgency: "IMMEDIATE",
    postedAt: "3 mins ago",
    customer: "Anand V.",
    description: "Main MCB switch is tripping repeatedly whenever AC is turned on. Need immediate diagnosis.",
  },
  {
    id: "lead-102",
    title: "Kitchen Sink Waste Pipe Burst & Leaking",
    category: "plumbing",
    categoryLabel: "Plumbing",
    area: "Lokhandwala Complex, Mumbai",
    distanceKm: 2.3,
    payoutMin: 350,
    payoutMax: 500,
    urgency: "URGENT",
    postedAt: "8 mins ago",
    customer: "Sneha P.",
    description: "Flexible PVC pipe under kitchen sink has cracked. Water spreading across cabinet floor.",
  },
  {
    id: "lead-103",
    title: "Ceiling Fan Regulator Sparking & Speed Issue",
    category: "electrical",
    categoryLabel: "Electrical",
    area: "Versova Metro, Mumbai",
    distanceKm: 2.9,
    payoutMin: 300,
    payoutMax: 450,
    urgency: "TODAY",
    postedAt: "19 mins ago",
    customer: "Vikram S.",
    description: "Switchboard knob is sparking when turned. Fan runs only on maximum speed 5.",
  },
  {
    id: "lead-104",
    title: "Main Wooden Door Latch & Lock Jammed",
    category: "carpentry",
    categoryLabel: "Carpentry",
    area: "Bandra West, Mumbai",
    distanceKm: 3.4,
    payoutMin: 500,
    payoutMax: 750,
    urgency: "URGENT",
    postedAt: "32 mins ago",
    customer: "Rahul M.",
    description: "Godrej mortise lock cylinder is sticking and latch does not retract smoothly.",
  },
  {
    id: "lead-105",
    title: "Split AC Indoor Water Dripping on Sofa",
    category: "appliances",
    categoryLabel: "Appliances",
    area: "Juhu Scheme, Mumbai",
    distanceKm: 4.1,
    payoutMin: 800,
    payoutMax: 1200,
    urgency: "TODAY",
    postedAt: "45 mins ago",
    customer: "Pooja D.",
    description: "1.5 ton inverter AC drain tray overflowing inside room. Needs drain pipe unclog and filter clean.",
  },
];

export function WorkerLeadBoard() {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredLeads = JOB_LEADS.filter((lead) => {
    return selectedCategory === "all" || lead.category === selectedCategory;
  });

  return (
    <section id="worker-leads" className="py-12 md:py-20">
      <div className="max-w-[1280px] mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-3">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Live Dispatch Wave Feed
            </div>
            <SectionTitle className="text-3xl sm:text-4xl font-semibold tracking-tight">
              Nearby Open Job Leads
            </SectionTitle>
            <p className="text-muted-foreground text-sm mt-2">
              Verified local service calls ready for instant acceptance. Direct bank escrow payout.
            </p>
          </div>

          <Link
            href="/worker"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-all shadow-md hover:shadow-lg"
            style={{
              background: "linear-gradient(135deg, #203eec 0%, #00d4ff 100%)",
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

        {/* Leads Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLeads.map((job) => (
            <article
              key={job.id}
              className="p-6 rounded-2xl md:rounded-3xl border border-border bg-card hover:border-foreground/20 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    {job.categoryLabel}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      job.urgency === "IMMEDIATE"
                        ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {job.urgency}
                  </span>
                </div>

                <h3 className="font-semibold text-lg text-foreground mb-2 leading-snug">
                  {job.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                  {job.description}
                </p>

                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground/70" />
                    <span>
                      {job.area} ({job.distanceKm} km away)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground/70" />
                    <span>Posted {job.postedAt}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border/70 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-muted-foreground block">Payout Range</span>
                  <span className="text-base font-bold text-foreground">
                    ₹{job.payoutMin} - ₹{job.payoutMax}
                  </span>
                </div>

                <Link
                  href="/worker"
                  className="px-4 py-2 rounded-full text-xs font-semibold text-white transition-transform hover:scale-105"
                  style={{
                    background: "linear-gradient(135deg, #203eec 0%, #00d4ff 100%)",
                  }}
                >
                  Accept Lead
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
