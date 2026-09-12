"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SectionTitle } from "@/components/landing/section-title";

const INSIGHTS = [
  {
    id: 1,
    title: "What to share when you book an electrician",
    excerpt:
      "Mention the room, the issue, and whether there is any sparking or power loss so a verified electrician arrives prepared.",
    image: "/services/electrician.webp",
    date: "Booking guide",
    readTime: "2 min read",
  },
  {
    id: 2,
    title: "A quick guide to handling a plumbing leak",
    excerpt:
      "Turn off the nearest water supply if you can, take a clear photo, and describe where the leak is before booking a plumber.",
    image: "/services/plumber.webp",
    date: "Home care",
    readTime: "3 min read",
  },
  {
    id: 3,
    title: "How KaamSetu keeps every service visit clear",
    excerpt:
      "Review the request, choose a verified professional, and track the work from acceptance through completion in one place.",
    image: "/services/handyman.webp",
    date: "Service standards",
    readTime: "2 min read",
  },
];

export function Insights() {
  return (
    <section id="insights" className="py-20 md:py-24 border-t border-border/60">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-12 md:mb-16">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">
              Made for your home
            </span>
            <SectionTitle className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight mt-2">
              Helpful before you book
            </SectionTitle>
          </div>
          <Link
            href="/customer/jobs/new"
            className="hidden md:inline-flex items-center gap-2 text-sm font-semibold transition-colors"
            style={{ color: "#203eec" }}
          >
            Book a service
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
                      sizes="(max-width: 768px) 100vw, 33vw"
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
                  <span>Book this service</span>
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
