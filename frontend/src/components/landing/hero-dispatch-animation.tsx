"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Zap,
  Wrench,
  Hammer,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  Clock,
  Star,
  ArrowRight,
  Radio,
} from "lucide-react";

interface LiveProScenario {
  id: string;
  trade: string;
  name: string;
  experience: string;
  rating: number;
  jobsCount: number;
  taskTitle: string;
  area: string;
  distance: string;
  eta: string;
  price: string;
  icon: typeof Zap;
  color: string;
}

const SCENARIOS: LiveProScenario[] = [
  {
    id: "electrical",
    trade: "Electrician",
    name: "Rajesh Kumar",
    experience: "8 yrs exp • Master Electrician",
    rating: 4.94,
    jobsCount: 1420,
    taskTitle: "MCB Tripping & Switchboard Short-Circuit",
    area: "Indiranagar, Bengaluru",
    distance: "1.1 km away",
    eta: "8 mins",
    price: "₹299",
    icon: Zap,
    color: "text-amber-500 bg-amber-500/10 border-amber-500/30",
  },
  {
    id: "plumbing",
    trade: "Plumber",
    name: "Mohammad Arif",
    experience: "11 yrs exp • Certified Plumber",
    rating: 4.96,
    jobsCount: 1890,
    taskTitle: "Kitchen Sink Pipe Burst & High-Pressure Leak",
    area: "Andheri West, Mumbai",
    distance: "850m away",
    eta: "6 mins",
    price: "₹349",
    icon: Wrench,
    color: "text-blue-500 bg-blue-500/10 border-blue-500/30",
  },
  {
    id: "carpentry",
    trade: "Carpenter",
    name: "Suresh Mistry",
    experience: "9 yrs exp • Woodcraft Specialist",
    rating: 4.89,
    jobsCount: 970,
    taskTitle: "Main Door Godrej Lock & Hydraulic Hinge Repair",
    area: "Rohini Sector 9, Delhi NCR",
    distance: "1.4 km away",
    eta: "11 mins",
    price: "₹399",
    icon: Hammer,
    color: "text-orange-500 bg-orange-500/10 border-orange-500/30",
  },
  {
    id: "appliances",
    trade: "AC Technician",
    name: "Vikram Singh",
    experience: "7 yrs exp • HVAC Specialist",
    rating: 4.92,
    jobsCount: 2310,
    taskTitle: "Split AC Deep Chemical Jet Wash & Gas Check",
    area: "Whitefield, Bengaluru",
    distance: "1.8 km away",
    eta: "14 mins",
    price: "₹499",
    icon: Sparkles,
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30",
  },
];

const LIVE_TICKER_ITEMS = [
  "⚡ Rajesh K. (Electrician) matched in 42s • Indiranagar",
  "🔧 M. Arif (Plumber) en route • ETA 6 mins • Andheri",
  "🪚 Suresh M. (Carpenter) completed lock repair • OTP verified",
  "❄️ Vikram S. (AC Tech) dispatched to Whitefield",
];

export function HeroDispatchAnimation() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [tickerIndex, setTickerIndex] = useState(0);

  // Auto-cycle scenarios every 4.5 seconds unless user hovers
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % SCENARIOS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isPaused]);

  // Live ticker updates every 3.2 seconds
  useEffect(() => {
    const tickerTimer = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % LIVE_TICKER_ITEMS.length);
    }, 3200);
    return () => clearInterval(tickerTimer);
  }, []);

  const activePro: LiveProScenario = SCENARIOS[activeIndex] ?? (SCENARIOS[0] as LiveProScenario);

  return (
    <div
      className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm relative overflow-hidden transition-all duration-300"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label="Live technician dispatch simulation"
    >
      {/* Live Dispatch Header Bar */}
      <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-border/60">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-xs font-semibold text-foreground tracking-tight">
            Live Dispatch Wave
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
          <Radio className="h-3 w-3 animate-pulse" />
          <span>Multi-Ring Wave Active</span>
        </div>
      </div>

      {/* Trade Selector Tabs */}
      <div className="grid grid-cols-4 gap-1.5 pt-3.5 pb-3">
        {SCENARIOS.map((scenario, idx) => {
          const Icon = scenario.icon;
          const isSelected = idx === activeIndex;
          return (
            <button
              key={scenario.id}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`flex flex-col items-center justify-center p-2 rounded-lg text-center transition-all duration-200 border ${
                isSelected
                  ? "bg-primary text-primary-foreground border-primary shadow-xs scale-[1.02]"
                  : "bg-background/80 text-muted-foreground border-border hover:bg-secondary hover:text-foreground"
              }`}
              aria-selected={isSelected}
              role="tab"
            >
              <Icon className="h-3.5 w-3.5 mb-1 shrink-0" />
              <span className="text-[11px] font-semibold leading-none truncate w-full">
                {scenario.trade}
              </span>
            </button>
          );
        })}
      </div>

      {/* Radar Map & Dispatch Animation Visual Area */}
      <div className="relative rounded-xl border border-border/70 bg-muted/30 p-4 mt-1 overflow-hidden">
        {/* Animated concentric radar pulse circles */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
          <div className="h-28 w-28 rounded-full border border-primary/20 animate-ping" />
          <div className="absolute h-44 w-44 rounded-full border border-primary/10" />
          <div className="absolute h-60 w-60 rounded-full border border-primary/5" />
        </div>

        {/* Dispatch Route Header */}
        <div className="flex items-center justify-between text-xs text-muted-foreground relative z-10">
          <span className="flex items-center gap-1 font-medium text-foreground">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            {activePro.area}
          </span>
          <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
            <Clock className="h-3 w-3" />
            ETA ~{activePro.eta}
          </span>
        </div>

        {/* Active Technician Profile Card with Transition */}
        <div className="mt-3.5 rounded-lg border border-border/80 bg-background/95 backdrop-blur-xs p-3.5 relative z-10 shadow-2xs transition-all duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              {/* Pro Avatar Badge with pulsing live dot */}
              <div className="relative">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {activePro.name.slice(0, 2).toUpperCase()}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-semibold text-sm text-foreground leading-tight">
                    {activePro.name}
                  </h3>
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 px-1.5 py-0.5 rounded">
                    <ShieldCheck className="h-3 w-3" />
                    Verified
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {activePro.experience}
                </p>
              </div>
            </div>

            {/* Rating badge */}
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-secondary text-xs font-semibold text-foreground shrink-0">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span>{activePro.rating}</span>
              <span className="text-[10px] text-muted-foreground font-normal">
                ({activePro.jobsCount})
              </span>
            </div>
          </div>

          {/* Assigned Task Details */}
          <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between text-xs">
            <div className="truncate pr-2">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                Instant Request
              </span>
              <span className="font-medium text-foreground truncate block">
                {activePro.taskTitle}
              </span>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                Fixed Escrow
              </span>
              <span className="font-bold text-foreground text-sm">
                {activePro.price}
              </span>
            </div>
          </div>

          {/* Animated 3-step dispatch status bar */}
          <div className="mt-3 pt-2.5 border-t border-border/60">
            <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground mb-1.5">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />
                Dispatched
              </span>
              <span className="text-foreground font-semibold">
                {activePro.distance}
              </span>
              <span>Doorstep OTP</span>
            </div>

            {/* Progress line */}
            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-700"
                style={{ width: "66%" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action CTA Button directly connected to current active scenario */}
      <div className="mt-3.5">
        <Link
          href={`/customer/jobs/new?trade=${activePro.id}`}
          className="w-full h-11 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-xs sm:text-sm inline-flex items-center justify-between shadow-xs transition-colors group"
        >
          <span>Book Verified {activePro.trade} (From {activePro.price})</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Live Animated Ticker at bottom */}
      <div className="mt-3 pt-3 border-t border-border/60 flex items-center gap-2 overflow-hidden text-xs text-muted-foreground">
        <span className="shrink-0 flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="truncate transition-opacity duration-300 font-medium">
          {LIVE_TICKER_ITEMS[tickerIndex]}
        </span>
      </div>
    </div>
  );
}
