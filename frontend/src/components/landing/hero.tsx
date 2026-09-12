"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Search,
  CheckCircle2,
} from "lucide-react";

interface HeroProps {
  onSearch?: (query: string) => void;
}

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
    // matchMedia instead of a resize listener: fires only when the breakpoint
    // actually flips, not on every pixel of a mobile browser chrome resize.
    const desktopQuery = window.matchMedia("(min-width: 768px)");
    const onDesktopChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    setIsDesktop(desktopQuery.matches);
    desktopQuery.addEventListener("change", onDesktopChange);

    // rAF-throttle scroll so we update opacity at most once per frame.
    let rafId = 0;
    const handleScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        setOpacity(Math.min(1, window.scrollY / 450));
      });
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", handleScroll);
      desktopQuery.removeEventListener("change", onDesktopChange);
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  return (
    <section className="relative overflow-hidden pt-8 md:pt-12 pb-16 md:pb-24">
      {/* 3D orb asset, tinted into the brand's navy/indigo family.
          `sizes` keeps phones from downloading the desktop-size PNG. */}
      <div className="absolute -right-32 md:-right-48 top-6 md:top-8 w-[440px] h-[440px] md:w-[680px] md:h-[680px] pointer-events-none animate-orb-rotate -z-10 scale-110 opacity-70">
        <Image
          src="/images/orb.png"
          alt=""
          width={680}
          height={680}
          sizes="(max-width: 767px) 440px, 680px"
          quality={75}
          className="w-full h-full object-contain orb-brand"
          priority
        />
      </div>

      {/* Ambient background blur blobs */}
      <div className="absolute top-1/4 -left-48 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10 w-full">
        <div className="max-w-4xl">


          {/* Headline — one promise, one stroke. The amber marker line draws
              once beneath "Skilled hands", the way tradespeople mark work. */}
          <h1 className="font-display text-4xl leading-[1.08] sm:text-6xl sm:leading-[1.04] lg:text-7xl xl:text-[84px] font-semibold tracking-tight text-foreground">
            <span className="marker-stroke">
              <RevealWord word="Skilled" delay={0} />
              <RevealWord word="hands" delay={0.06} />
            </span>
            <RevealWord word="at" delay={0.12} />
            <RevealWord word="your" delay={0.18} />
            <RevealWord word="doorstep," delay={0.24} />
            <RevealWord word="fast" delay={0.3} />
            <RevealWord word="and" delay={0.36} />
            <RevealWord word="verified." delay={0.42} />
          </h1>

          <p className="mt-6 max-w-xl leading-relaxed text-base sm:text-lg text-muted-foreground">
            Post your requirement, get matched with verified local tradespeople,
            and approve payment only when the job is completed to your satisfaction.
          </p>

          {/* Interactive Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="mt-8 flex flex-col sm:flex-row items-center gap-3 p-2 bg-card/80 backdrop-blur-md rounded-2xl border border-border shadow-sm max-w-xl"
          >
            <div className="flex items-center gap-3 px-3 py-2 w-full min-w-0">
              <Search className="w-5 h-5 text-muted-foreground shrink-0" />
              <input
                type="text"
                // 16px on phones: smaller inputs make iOS Safari zoom the page
                inputMode="text"
                placeholder="What help do you need? (e.g. MCB tripping, leaking pipe)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full min-w-0 bg-transparent text-[16px] sm:text-base outline-none text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <Link
              href={searchQuery ? `/customer/jobs/new?query=${encodeURIComponent(searchQuery)}` : "/customer/jobs/new"}
              className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 shrink-0 text-center transition-colors shadow-xs whitespace-nowrap"
            >
              Find Pro
            </Link>
          </form>

          {/* Primary & Secondary Dual CTAs */}
          <div className="flex flex-wrap items-center gap-4 mt-8">
            <Link
              href="/customer/jobs/new"
              className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 text-sm sm:text-base font-semibold text-primary-foreground bg-primary hover:bg-primary/90 rounded-xl shadow-xs transition-colors whitespace-nowrap group"
            >
              Post a Job in 60s
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <Link
              href="/worker"
              className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 text-sm sm:text-base font-semibold rounded-xl border border-border hover:bg-secondary transition-colors text-foreground whitespace-nowrap"
            >
              Join as Worker &amp; Earn
            </Link>
          </div>
        </div>
      </div>

      {/* Interactive Platform Live Snapshot with parallax reveal */}
      <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10 mt-10 md:mt-14">
        <div
          className="relative rounded-2xl md:rounded-3xl border border-border bg-card/60 backdrop-blur-xl overflow-hidden shadow-2xl transition-all duration-300"
          style={{
            opacity: isDesktop ? Math.max(0.65, opacity) : 1,
            transform: isDesktop ? `translateY(${(1 - Math.max(0.65, opacity)) * 20}px)` : "none",
          }}
        >
          {/* Showcase Content */}
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
            {/* Stat 1 */}
            <div className="p-5 sm:p-6 flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <div className="font-display text-2xl font-bold">Fast Match</div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">
                  Proximity Dispatch
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Geospatial matching alerts available verified technicians nearest to your location.
                </p>
              </div>
            </div>

            {/* Stat 2 */}
            <div className="p-5 sm:p-6 flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="font-display text-2xl font-bold">Verified ID</div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">
                  Identity &amp; Skills Verified
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Every technician undergoes government ID verification and skill evaluation before taking jobs.
                </p>
              </div>
            </div>

            {/* Stat 3 */}
            <div className="p-5 sm:p-6 flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="font-display text-2xl font-bold">Secure OTP</div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">
                  Authorized Payment Release
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Payment is authorized and ledger-recorded only after you share the completion OTP.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
