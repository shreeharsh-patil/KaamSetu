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
} from "lucide-react";
import { SectionTitle } from "@/components/landing/section-title";
import { jobsApi } from "@/features/jobs/api";

const CATEGORY_META: Record<
  string,
  {
    icon: typeof Wrench;
    summary: string;
    badge: string;
  }
> = {
  plumbing: {
    icon: Wrench,
    summary: "Fix leaks, pipe blockages, taps, flush valves, and water tank pumps.",
    badge: "Plumbing",
  },
  electrical: {
    icon: Zap,
    summary: "Diagnose tripping breakers, wiring shorts, switchboards, and fan repairs.",
    badge: "Electrical",
  },
  carpentry: {
    icon: Hammer,
    summary: "Door lock repairs, hinge alignment, furniture assembly, and custom woodwork.",
    badge: "Carpentry",
  },
  painting: {
    icon: Paintbrush,
    summary: "Interior wall touchups, waterproofing coats, and exterior surface painting.",
    badge: "Painting",
  },
  cleaning: {
    icon: Sparkles,
    summary: "Deep home cleaning, kitchen degreasing, bathroom descaling, and floor buffing.",
    badge: "Cleaning",
  },
  appliances: {
    icon: Tv,
    summary: "Service air conditioners, washing machines, refrigerators, and microwaves.",
    badge: "Appliances",
  },
  masonry: {
    icon: Building2,
    summary: "Tile replacement, plaster patching, brickwork, and waterproofing masonry.",
    badge: "Masonry",
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
    <section id="services" className="py-16 md:py-24 border-t border-border/60">
      <div className="max-w-[1280px] mx-auto px-6 md:px-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#203eec] dark:text-blue-400">
              Verified Marketplace Trades
            </span>
            <SectionTitle className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight mt-2 text-balance">
              Services Available Near You
            </SectionTitle>
            <p className="mt-3 text-muted-foreground text-base max-w-xl">
              Select a trade to connect with experienced, local technicians for fast on-site assistance.
            </p>
          </div>

          <Link
            href="/customer/jobs/new"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#203eec] hover:underline dark:text-blue-400 w-max"
          >
            Post a custom request
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeCategories.map((category) => {
            const slugKey = category.slug.toLowerCase();
            const meta =
              CATEGORY_META[slugKey] ||
              Object.entries(CATEGORY_META).find(([key]) => slugKey.includes(key))?.[1] || {
                icon: Wrench,
                summary: `Professional ${category.name.toLowerCase()} service by verified local workers.`,
                badge: category.name,
              };

            const Icon = meta.icon;

            return (
              <div
                key={category.id}
                className="p-6 rounded-xl border border-border/80 bg-card hover:border-[#203eec]/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-[#203eec]/10 text-[#203eec] dark:text-blue-400 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground">
                      {meta.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {category.name}
                  </h3>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {meta.summary}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Verified workers</span>
                  </div>
                  <Link
                    href={`/customer/jobs/new?category=${encodeURIComponent(category.id)}`}
                    className="text-xs font-semibold text-[#203eec] hover:underline dark:text-blue-400 inline-flex items-center gap-1"
                  >
                    Book
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
