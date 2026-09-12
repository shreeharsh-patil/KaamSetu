"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Star } from "lucide-react";
import { SectionTitle } from "@/components/landing/section-title";

const SERVICES = [
  {
    id: "electrical",
    title: "Electrical Emergencies & Tripping Breakers",
    category: "Master Electrician",
    priceStarting: 299,
    description:
      "Rapid diagnosis of tripping MCBs, short-circuits, sparking switchboards, inverter failure, and full concealed wire health checks.",
    image: "/images/work-tasks.png",
    tags: ["Tripping MCB", "Inverter Setup", "Concealed Wiring", "15m Dispatch"],
    rating: 4.9,
    ratingCount: 1420,
  },
  {
    id: "plumbing",
    title: "Precision Plumbing & High-Pressure Leaks",
    category: "Certified Plumber",
    priceStarting: 349,
    description:
      "Instant resolution for burst pipes, drain blockages, diverter valves, bathroom sanitary fittings, and water motor pressure repairs.",
    image: "/images/work-onboarding.png",
    tags: ["Pipe Burst", "Drain Jetting", "Motor Pump", "Sanitary Fit"],
    rating: 4.95,
    ratingCount: 1890,
  },
  {
    id: "carpentry",
    title: "Custom Carpentry, Locks & Furniture Restoration",
    category: "Woodcraft Specialist",
    priceStarting: 399,
    description:
      "Door lock and cylinder replacement, hinge alignment, custom modular kitchen repairs, bed assembly, and high-precision woodwork.",
    image: "/images/work-fashion.png",
    tags: ["Godrej Locks", "Hydraulic Hinges", "Door Alignment", "Assembly"],
    rating: 4.88,
    ratingCount: 970,
  },
  {
    id: "appliances",
    title: "AC Deep Cleaning, Gas Charging & Appliances",
    category: "HVAC Technician",
    priceStarting: 499,
    description:
      "Jet pump AC chemical wash, refrigerant top-up, washing machine PCB diagnosis, microwave magnetron fix, and refrigerator compressor repairs.",
    image: "/images/work-crypto.png",
    tags: ["Jet Wash", "R32 Gas Refill", "Inverter PCB", "30-Day Warranty"],
    rating: 4.92,
    ratingCount: 2310,
  },
];

export function FeaturedServices() {
  return (
    <section id="services" className="py-16 md:py-24 relative">
      <div className="max-w-[1280px] mx-auto px-6 md:px-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 md:mb-16 gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">
              Verified Master Trades
            </span>
            <SectionTitle className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight mt-2">
              On-Demand Skilled Services
            </SectionTitle>
          </div>
          <Link
            href="/customer/jobs/new"
            className="inline-flex items-center gap-2 text-sm font-semibold transition-colors"
            style={{ color: "#203eec" }}
          >
            <span>Browse All Rate Cards</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Stacked Sticky Work Cards */}
        <div className="relative space-y-8">
          {SERVICES.map((service, index) => (
            <div
              key={service.id}
              className="sticky"
              style={{
                top: `${80 + index * 12}px`,
                zIndex: index + 1,
              }}
            >
              <Link
                href={`/customer/jobs/new?trade=${service.id}`}
                className="group block"
              >
                <article className="overflow-hidden rounded-2xl md:rounded-3xl border border-border bg-card/95 backdrop-blur-lg transition-all duration-300 hover:shadow-2xl hover:border-foreground/20">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                    {/* Visual Media */}
                    <div className="relative aspect-[16/9] lg:aspect-auto lg:col-span-5 overflow-hidden bg-secondary min-h-[220px]">
                      <Image
                        src={service.image}
                        alt={service.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent lg:hidden" />
                      <div className="absolute bottom-3 left-3 lg:hidden text-white">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md">
                          Starts at ₹{service.priceStarting}
                        </span>
                      </div>
                    </div>

                    {/* Content Details */}
                    <div className="p-6 md:p-8 lg:col-span-7 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                            {service.category}
                          </span>
                          <div className="flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span>{service.rating}</span>
                            <span className="text-muted-foreground font-normal">
                              ({service.ratingCount})
                            </span>
                          </div>
                        </div>

                        <h3 className="text-xl sm:text-2xl font-semibold tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {service.title}
                        </h3>

                        <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                          {service.description}
                        </p>
                      </div>

                      <div className="mt-6 pt-6 border-t border-border/80 flex flex-wrap items-center justify-between gap-4">
                        {/* Tags */}
                        <div className="flex flex-wrap gap-2">
                          {service.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-3 py-1 text-xs font-medium bg-secondary text-secondary-foreground rounded-full border border-border/50"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* Starting Price & Book Button */}
                        <div className="flex items-center gap-4">
                          <div className="hidden sm:block text-right">
                            <span className="text-xs text-muted-foreground block">Starting Rate</span>
                            <span className="text-lg font-bold text-foreground">
                              ₹{service.priceStarting}
                            </span>
                          </div>
                          <div
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold text-white transition-all duration-200 group-hover:scale-105"
                            style={{
                              background: "linear-gradient(135deg, #203eec 0%, #00d4ff 100%)",
                            }}
                          >
                            <span>Book Now</span>
                            <ArrowUpRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            </div>
          ))}
        </div>

        {/* Mobile View All button */}
        <div className="md:hidden mt-8 text-center">
          <Link
            href="/customer/jobs/new"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold border rounded-full hover:bg-secondary transition-colors"
            style={{ color: "#203eec", borderColor: "#203eec" }}
          >
            View All Services & Rate Cards
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
