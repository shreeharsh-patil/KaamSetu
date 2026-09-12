"use client";

import Image from "next/image";
import { Star, ShieldCheck } from "lucide-react";
import { SectionTitle } from "@/components/landing/section-title";

const TESTIMONIALS = [
  {
    id: 1,
    quote:
      "Our main MCB tripped at 10 PM on a Sunday. Posted on KaamSetu, and within 14 minutes a verified master electrician was at our doorstep with diagnostic tools.",
    author: "Anand Verma",
    role: "Homeowner in Bandra, Mumbai",
    avatar: "/images/imgi_97_user77.webp",
    trade: "Electrical Emergency",
    rating: 5,
    blurColor: "bg-blue-500",
  },
  {
    id: 2,
    quote:
      "As a certified electrician, platforms usually took 30% cut and delayed payments for weeks. On KaamSetu, the money is transferred to my UPI the moment the customer enters the OTP.",
    author: "Ramesh Singh",
    role: "Master Electrician (4.9★)",
    avatar: "/images/imgi_106_user86.webp",
    trade: "Worker Partner",
    rating: 5,
    blurColor: "bg-purple-500",
  },
  {
    id: 3,
    quote:
      "The escrow system gives tremendous peace of mind. You don't have to negotiate or worry if the work isn't done properly—the rate card is fixed upfront.",
    author: "Sneha Patil",
    role: "Interior Architect, Pune",
    avatar: "/images/imgi_105_user85.webp",
    trade: "Custom Carpentry",
    rating: 5,
    blurColor: "bg-emerald-500",
  },
  {
    id: 4,
    quote:
      "Kitchen sink pipe cracked and flooded my apartment. The plumber reached faster than an ambulance. Repaired the fixture cleanly with zero mess left behind.",
    author: "Pooja Desai",
    role: "Resident in Indiranagar, Bengaluru",
    avatar: "/images/imgi_102_user82.webp",
    trade: "Plumbing Repair",
    rating: 5,
    blurColor: "bg-orange-500",
  },
  {
    id: 5,
    quote:
      "I've completed 280+ plumbing jobs here. Honest customers, live GPS routing so I don't waste petrol wandering lanes, and direct weekly insurance coverage.",
    author: "Rajesh Kumar",
    role: "Senior Plumber (312 Jobs)",
    avatar: "/images/imgi_100_user80.webp",
    trade: "Worker Partner",
    rating: 5,
    blurColor: "bg-cyan-500",
  },
  {
    id: 6,
    quote:
      "Being able to explain our AC leak in Hindi via audio recording made this so effortless for my elderly parents. The technician was polite, verified, and punctual.",
    author: "Vikram Sharma",
    role: "Software Engineer, Gurgaon",
    avatar: "/images/imgi_107_user87.webp",
    trade: "Appliance Repair",
    rating: 5,
    blurColor: "bg-rose-500",
  },
  {
    id: 7,
    quote:
      "The transparency of KaamSetu is unlike any other service app. You see the technician's Aadhaar verification, real ratings from neighbours, and exact prices.",
    author: "Aditi Rao",
    role: "Homeowner, HSR Layout, Bengaluru",
    avatar: "/images/imgi_108_user88.webp",
    trade: "Home Renovation",
    rating: 5,
    blurColor: "bg-indigo-500",
  },
];

export function Testimonials() {
  const row1 = [...TESTIMONIALS, ...TESTIMONIALS];
  const row2 = [...TESTIMONIALS.slice().reverse(), ...TESTIMONIALS.slice().reverse()];

  return (
    <section id="testimonials" className="py-20 md:py-28 overflow-hidden relative">
      <div className="max-w-[1280px] mx-auto px-6 md:px-12 mb-12 md:mb-16">
        <span className="text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">
          Verified Reviews
        </span>
        <SectionTitle className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight mt-2">
          Trusted by Homeowners & Skilled Workers Alike
        </SectionTitle>
        <p className="mt-4 text-muted-foreground max-w-2xl text-base">
          Read unfiltered feedback from residents across Mumbai, Bengaluru, and Pune who rely on KaamSetu daily.
        </p>
      </div>

      {/* Row 1: Scrolling Left */}
      <div className="relative mb-6">
        <div className="flex gap-6 animate-scroll-left hover:[animation-play-state:paused] w-max">
          {row1.map((item, index) => (
            <div
              key={`row1-${item.id}-${index}`}
              className="w-[340px] sm:w-[420px] p-6 rounded-2xl md:rounded-3xl border border-border bg-card/90 backdrop-blur-md shrink-0 transition-all duration-300 hover:shadow-xl hover:border-foreground/20 relative group"
            >
              {/* Colored ambient glow */}
              <div
                className={`absolute -top-10 -right-10 w-24 h-24 ${item.blurColor} opacity-10 rounded-full blur-2xl pointer-events-none group-hover:opacity-25 transition-opacity`}
              />

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(item.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-secondary text-muted-foreground">
                  {item.trade}
                </span>
              </div>

              <p className="text-sm text-foreground/90 leading-relaxed min-h-[72px]">
                "{item.quote}"
              </p>

              <div className="mt-5 pt-4 border-t border-border/60 flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden border border-border shrink-0">
                  <Image src={item.avatar} alt={item.author} fill sizes="40px" className="object-cover" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    {item.author}
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <div className="text-xs text-muted-foreground">{item.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Row 2: Scrolling Right */}
      <div className="relative">
        <div className="flex gap-6 animate-scroll-right hover:[animation-play-state:paused] w-max">
          {row2.map((item, index) => (
            <div
              key={`row2-${item.id}-${index}`}
              className="w-[340px] sm:w-[420px] p-6 rounded-2xl md:rounded-3xl border border-border bg-card/90 backdrop-blur-md shrink-0 transition-all duration-300 hover:shadow-xl hover:border-foreground/20 relative group"
            >
              {/* Colored ambient glow */}
              <div
                className={`absolute -top-10 -right-10 w-24 h-24 ${item.blurColor} opacity-10 rounded-full blur-2xl pointer-events-none group-hover:opacity-25 transition-opacity`}
              />

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(item.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-secondary text-muted-foreground">
                  {item.trade}
                </span>
              </div>

              <p className="text-sm text-foreground/90 leading-relaxed min-h-[72px]">
                "{item.quote}"
              </p>

              <div className="mt-5 pt-4 border-t border-border/60 flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden border border-border shrink-0">
                  <Image src={item.avatar} alt={item.author} fill sizes="40px" className="object-cover" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    {item.author}
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <div className="text-xs text-muted-foreground">{item.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
