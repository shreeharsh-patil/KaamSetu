"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Wrench,
  Zap,
  Hammer,
  Paintbrush,
  Sparkles,
  Tv,
  Building2,
  ArrowRight,
  ShieldCheck,
  ArrowUpRight,
} from "lucide-react";
import { SectionTitle } from "@/components/landing/section-title";
import { jobsApi } from "@/features/jobs/api";

const CATEGORY_META: Record<
  string,
  {
    icon: typeof Wrench;
    summary: string;
    badge: string;
    rateBenchmark: string;
    commonTasks: string[];
  }
> = {
  plumbing: {
    icon: Wrench,
    summary: "High-pressure pipe leaks, drain jetting, diverter valves, bathroom sanitary fittings, and water pump pressure repairs.",
    badge: "Plumbing",
    rateBenchmark: "₹349",
    commonTasks: ["Pipe Burst", "Drain Jetting", "Tap Repair", "Sanitary Fit"],
  },
  electrical: {
    icon: Zap,
    summary: "Rapid diagnosis of tripping MCBs, short-circuits, sparking switchboards, inverter failure, and full concealed wiring health checks.",
    badge: "Electrical",
    rateBenchmark: "₹299",
    commonTasks: ["Tripping MCB", "Inverter Setup", "Concealed Wiring", "Switchboard"],
  },
  carpentry: {
    icon: Hammer,
    summary: "Door lock and cylinder replacement, hinge alignment, custom modular kitchen repairs, bed assembly, and high-precision woodwork.",
    badge: "Carpentry",
    rateBenchmark: "₹399",
    commonTasks: ["Lock Repair", "Hinges", "Door Alignment", "Furniture Assembly"],
  },
  painting: {
    icon: Paintbrush,
    summary: "Interior wall waterproofing coats, touchup putty application, exterior weather-coat painting, and clean surface refinishing.",
    badge: "Painting",
    rateBenchmark: "₹499",
    commonTasks: ["Waterproofing", "Wall Putty", "Interior Emulsion", "Texture Finish"],
  },
  cleaning: {
    icon: Sparkles,
    summary: "Deep home sanitization, kitchen degreasing, bathroom descaling, sofa shampooing, and professional floor buffing.",
    badge: "Cleaning",
    rateBenchmark: "₹449",
    commonTasks: ["Deep Cleaning", "Kitchen Degrease", "Bathroom Descaling", "Floor Polish"],
  },
  appliances: {
    icon: Tv,
    summary: "AC chemical jet wash, refrigerant gas top-up, washing machine PCB diagnosis, and microwave or refrigerator repairs.",
    badge: "Appliances",
    rateBenchmark: "₹499",
    commonTasks: ["AC Jet Wash", "Gas Refill", "PCB Diagnosis", "Motor Servicing"],
  },
  masonry: {
    icon: Building2,
    summary: "Floor and wall tile replacement, crack patching, brickwork restoration, and bathroom waterproofing civil repairs.",
    badge: "Masonry",
    rateBenchmark: "₹549",
    commonTasks: ["Tile Laying", "Plaster Patch", "Waterproofing", "Brickwork"],
  },
};

export function FeaturedServices() {
  const { data: categories = [] } = useQuery({
    queryKey: ["service-categories"],
    queryFn: jobsApi.getCategories,
  });

  // Fallback list if API categories are loading or offline
  const activeCategories =
    categories.length > 0
      ? categories.filter((c) => c.active !== false)
      : [
          { id: "cat-elec", name: "Electrical", slug: "electrical" },
          { id: "cat-plumb", name: "Plumbing", slug: "plumbing" },
          { id: "cat-carp", name: "Carpentry", slug: "carpentry" },
          { id: "cat-paint", name: "Painting", slug: "painting" },
          { id: "cat-clean", name: "Cleaning", slug: "cleaning" },
          { id: "cat-app", name: "Appliances", slug: "appliances" },
        ];

  return (
    <section id="services" className="py-16 md:py-24 border-t border-border/60 relative">
      <div className="max-w-[1280px] mx-auto px-6 md:px-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 md:mb-16 gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#203eec] dark:text-blue-400">
              Verified Marketplace Trades
            </span>
            <SectionTitle className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight mt-2 text-balance">
              Services Available Near You
            </SectionTitle>
            <p className="mt-3 text-muted-foreground text-base max-w-xl">
              Scroll through active trades to connect with qualified, background-verified technicians in your immediate area.
            </p>
          </div>

          <Link
            href="/customer/jobs/new"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#203eec] hover:underline dark:text-blue-400 w-max"
          >
            <span>Post a custom request</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Stacked Sticky Work Cards on Scroll (ai-product-portfolio interaction) */}
        <div className="relative space-y-6">
          {activeCategories.map((category, index) => {
            const slugKey = category.slug.toLowerCase();
            const meta =
              CATEGORY_META[slugKey] ||
              Object.entries(CATEGORY_META).find(([key]) => slugKey.includes(key))?.[1] || {
                icon: Wrench,
                summary: `Professional ${category.name.toLowerCase()} services dispatched to verified local technicians.`,
                badge: category.name,
                rateBenchmark: "₹299",
                commonTasks: ["Diagnostics", "Repair", "Replacement"],
              };

            const Icon = meta.icon;

            return (
              <div
                key={category.id}
                className="sticky"
                style={{
                  top: `${80 + index * 12}px`,
                  zIndex: index + 1,
                }}
              >
                <article className="overflow-hidden rounded-2xl md:rounded-3xl border border-border/80 bg-card/95 backdrop-blur-md transition-all duration-300 hover:shadow-xl hover:border-[#203eec]/40 p-6 md:p-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    {/* Left: Icon & Details */}
                    <div className="flex items-start gap-5 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-[#203eec]/10 text-[#203eec] dark:text-blue-400 flex items-center justify-center shrink-0 mt-1">
                        <Icon className="w-6 h-6" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1.5">
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-secondary text-secondary-foreground">
                            {meta.badge}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            Verified Trade
                          </span>
                        </div>

                        <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
                          {category.name} Services
                        </h3>

                        <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-2xl">
                          {meta.summary}
                        </p>

                        {/* Task Tags */}
                        <div className="flex flex-wrap gap-2 mt-4">
                          {meta.commonTasks.map((task) => (
                            <span
                              key={task}
                              className="px-2.5 py-1 text-xs font-medium rounded-md bg-secondary/70 text-secondary-foreground border border-border/50"
                            >
                              {task}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right: Rate & Action */}
                    <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-border/60 shrink-0">
                      <div className="text-left md:text-right">
                        <span className="text-xs text-muted-foreground block">Typical Base Rate</span>
                        <span className="text-xl sm:text-2xl font-bold text-foreground">
                          {meta.rateBenchmark}
                        </span>
                      </div>

                      <Link
                        href={`/customer/jobs/new?category=${encodeURIComponent(category.id)}`}
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold text-white bg-[#162044] hover:bg-[#203eec] dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors shadow-xs"
                      >
                        <span>Book Service</span>
                        <ArrowUpRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </article>
              </div>
            );
          })}
        </div>

        {/* Mobile View All */}
        <div className="md:hidden mt-8 text-center">
          <Link
            href="/customer/jobs/new"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold border border-border rounded-lg hover:bg-secondary transition-colors"
          >
            <span>Post a Custom Request</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
