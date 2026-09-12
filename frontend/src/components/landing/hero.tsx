"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Wrench,
  Hammer,
  Search,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

interface HeroProps {
  onSearch?: (query: string) => void;
}

const QUICK_TRADES = [
  { id: "electrical", label: "Electrician", icon: Zap, count: "48 online" },
  { id: "plumbing", label: "Plumbing", icon: Wrench, count: "62 online" },
  { id: "carpentry", label: "Carpentry", icon: Hammer, count: "31 online" },
  { id: "appliances", label: "AC Repair", icon: Sparkles, count: "29 online" },
];

/** One word of the headline, revealed on load. */
function RevealWord({
  word,
  delay,
  className = "",
}: {
  word: string;
  delay: number;
  className?: string;
}) {
  return (
    <span
      className={`hero-word ${className}`}
      style={{ animationDelay: `${delay}s`, marginRight: "0.24em" }}
    >
      {word}
    </span>
  );
}

export function Hero({ onSearch }: HeroProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [opacity, setOpacity] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };

    checkDesktop();
    window.addEventListener("resize", checkDesktop);

    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const maxScroll = 450;
      const calculatedOpacity = Math.min(1, scrollPosition / maxScroll);
      setOpacity(calculatedOpacity);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", checkDesktop);
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  return (
    <section className="min-h-[90vh] flex flex-col justify-center pt-8 md:pt-14 relative overflow-hidden">
      {/* 3D orb asset, tinted into the brand's navy/indigo family */}
      <div className="absolute -right-32 md:-right-48 top-12 md:top-20 w-[460px] h-[460px] md:w-[740px] md:h-[740px] pointer-events-none animate-orb-rotate -z-10 scale-110 opacity-80">
        <Image
          src="/images/orb.png"
          alt=""
          width={740}
          height={740}
          className="w-full h-full object-contain orb-brand"
          priority
        />
      </div>

      {/* Ambient background blur blobs */}
      <div className="absolute top-1/4 -left-48 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-[1280px] mx-auto px-6 md:px-12 py-12 md:py-20 w-full">
        <div className="max-w-4xl">
          {/* Single quiet proof line — what the platform actually is */}
          <p className="flex items-center gap-2 text-sm sm:text-base font-medium text-muted-foreground mb-6">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Verified local electricians, plumbers &amp; carpenters
          </p>

          {/* Headline — one promise, one stroke. The amber marker line draws
              once beneath "Skilled hands", the way tradespeople mark work. */}
          <h1 className="font-display text-[2.6rem] leading-[1.04] sm:text-6xl lg:text-7xl xl:text-[84px] font-semibold tracking-tight text-foreground">
            <span className="marker-stroke">
              <RevealWord word="Skilled" delay={0} />
              <RevealWord word="hands" delay={0.06} />
            </span>
            <RevealWord word="at" delay={0.12} />
            <RevealWord word="your" delay={0.18} />
            <RevealWord word="doorstep" delay={0.24} />
            <RevealWord word="in" delay={0.3} />
            <RevealWord word="15" delay={0.36} className="numeric" />
            <RevealWord word="minutes." delay={0.42} />
          </h1>

          <p className="mt-7 max-w-xl leading-relaxed text-base sm:text-lg text-muted-foreground">
            Post the job, get matched to the nearest verified pro in about 15
            minutes, and pay through escrow only when the work is done.
          </p>

          {/* Interactive Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="mt-8 flex flex-col sm:flex-row items-center gap-3 p-2 bg-card/80 backdrop-blur-md rounded-2xl border border-border shadow-lg max-w-xl"
          >
            <div className="flex items-center gap-3 px-3 py-2 w-full">
              <Search className="w-5 h-5 text-muted-foreground shrink-0" />
              <input
                type="text"
                placeholder="What help do you need? (e.g. MCB tripping, leaking pipe)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm sm:text-base outline-none text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <Link
              href={searchQuery ? `/customer/jobs/new?query=${encodeURIComponent(searchQuery)}` : "/customer/jobs/new"}
              className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-semibold text-white shrink-0 text-center transition-all duration-200"
              style={{
                background: "linear-gradient(135deg, #162044 0%, #203eec 100%)",
                boxShadow: "0 4px 18px rgba(32, 62, 236, 0.3)",
              }}
            >
              Find Pro
            </Link>
          </form>

          {/* Quick Trade Badges */}
          <div className="flex flex-wrap items-center gap-2 mt-4 text-xs">
            <span className="text-muted-foreground font-medium mr-1">Popular:</span>
            {QUICK_TRADES.map((trade) => {
              const Icon = trade.icon;
              return (
                <Link
                  key={trade.id}
                  href={`/customer/jobs/new?trade=${trade.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/80 hover:bg-secondary border border-border/70 text-foreground transition-all duration-150 hover:-translate-y-0.5"
                >
                  <Icon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium">{trade.label}</span>
                  <span className="text-[10px] text-muted-foreground ml-0.5 numeric">({trade.count})</span>
                </Link>
              );
            })}
          </div>

          {/* Primary & Secondary Dual CTAs */}
          <div className="flex flex-wrap items-center gap-4 mt-8">
            <Link
              href="/customer/jobs/new"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white rounded-full transition-all relative overflow-hidden group"
              style={{
                background: "linear-gradient(135deg, #162044 0%, #203eec 100%)",
                boxShadow: "0 4px 20px rgba(32, 62, 236, 0.3)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 8px 28px rgba(32, 62, 236, 0.45)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(32, 62, 236, 0.3)";
              }}
            >
              Post a Job in 60s
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <Link
              href="/worker"
              className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold rounded-full border border-border hover:bg-secondary transition-colors text-foreground"
            >
              Join as Worker &amp; Earn
            </Link>
          </div>
        </div>
      </div>

      {/* Interactive Platform Live Snapshot with parallax reveal */}
      <div className="w-full max-w-[1280px] mx-auto px-6 md:px-12 mt-4 md:mt-8">
        <div
          className="relative rounded-2xl md:rounded-3xl border border-border bg-card/60 backdrop-blur-xl overflow-hidden shadow-2xl transition-all duration-300"
          style={{
            opacity: isDesktop ? Math.max(0.65, opacity) : 1,
            transform: isDesktop ? `translateY(${(1 - Math.max(0.65, opacity)) * 20}px)` : "none",
          }}
        >
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 md:px-6 border-b border-border/80 bg-muted/40">
            <div className="flex items-center gap-3">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
              <span className="font-display font-semibold text-xs sm:text-sm">Live marketplace pulse</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
                Mumbai, Bengaluru &amp; Delhi NCR
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground numeric">
              <span>Avg match time 82s</span>
              <span>Escrow on every job</span>
            </div>
          </div>

          {/* Showcase Content */}
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
            {/* Stat 1 */}
            <div className="p-6 flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <div className="font-display text-2xl font-bold numeric">15 Mins</div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">
                  Geospatial Dispatch Wave
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Multi-ring geo-fencing alerts the nearest 5 verified technicians simultaneously.
                </p>
              </div>
            </div>

            {/* Stat 2 */}
            <div className="p-6 flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="font-display text-2xl font-bold">Zero Fraud</div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">
                  Aadhaar &amp; Police Verified
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Every technician undergoes biometric Aadhaar verification and skill benchmarking.
                </p>
              </div>
            </div>

            {/* Stat 3 */}
            <div className="p-6 flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="font-display text-2xl font-bold numeric">100% Escrow</div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">
                  Direct Bank UPI Payouts
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Customer funds stay safe in escrow until completion OTP is exchanged at your doorstep.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
