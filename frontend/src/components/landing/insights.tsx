"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SectionTitle } from "@/components/landing/section-title";

const INSIGHTS = [
  {
    id: 1,
    title: "How Geospatial Wave Dispatch Finds Your Nearest Pro in 120s",
    excerpt:
      "An in-depth breakdown of how our low-latency geospatial multi-ring dispatch engine matches active verified technicians within a 3km radius.",
    image: "/images/bg-1.png",
    date: "Marketplace Tech",
    readTime: "4 min read",
  },
  {
    id: 2,
    title: "The Fair Wage Index: Why Technicians Earn 35% Higher Net Income",
    excerpt:
      "How removing commission-heavy agencies empowers local electricians and plumbers with direct UPI escrow payments and instant payouts.",
    image: "/images/bg-2.png",
    date: "Worker Economics",
    readTime: "5 min read",
  },
  {
    id: 3,
    title: "Homeowner Safety Guide: OTP Handshake and Escrow Milestones",
    excerpt:
      "Everything you need to know about your payment security, doorstep verification, and the 30-day workmanship re-inspection guarantee.",
    image: "/images/bg-3.png",
    date: "Consumer Trust",
    readTime: "3 min read",
  },
];

export function Insights() {
  return (
    <section id="insights" className="py-20 md:py-24 border-t border-border/60">
      <div className="max-w-[1280px] mx-auto px-6 md:px-12">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-12 md:mb-16">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">
              Field Reports & Standards
            </span>
            <SectionTitle className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight mt-2">
              Platform Insights
            </SectionTitle>
          </div>
          <Link
            href="/customer/jobs/new"
            className="hidden md:inline-flex items-center gap-2 text-sm font-semibold transition-colors"
            style={{ color: "#203eec" }}
          >
            Explore Platform Docs
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Insights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {INSIGHTS.map((item) => (
            <Link key={item.id} href="/customer/jobs/new" className="group block">
              <article className="h-full flex flex-col justify-between">
                <div>
                  {/* Image */}
                  <div className="relative aspect-[16/10] overflow-hidden rounded-2xl md:rounded-3xl bg-secondary mb-5 border border-border">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2.5 font-medium">
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">{item.date}</span>
                    <span>•</span>
                    <span>{item.readTime}</span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg sm:text-xl font-semibold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
                    {item.title}
                  </h3>

                  {/* Excerpt */}
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    {item.excerpt}
                  </p>
                </div>

                <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:underline">
                  <span>Read full analysis</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
