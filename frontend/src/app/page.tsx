"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Wrench,
  Zap,
  Hammer,
  Paintbrush,
  Sparkles,
  Tv,
  Building2,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Search,
  Star,
  MapPin,
  Users,
  Briefcase,
  Layers,
  ChevronRight,
  Sliders,
  BellRing,
  IndianRupee,
  Radio,
  ArrowRight,
} from "lucide-react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { PriceDisplay } from "@/components/shared/price-display";

import { useTranslation } from "@/lib/i18n/i18n-context";

const CATEGORIES = [
  { id: "plumbing", name: "Plumbing", icon: Wrench, color: "text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-950/40", count: 6 },
  { id: "electrical", name: "Electrical", icon: Zap, color: "text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-950/40", count: 5 },
  { id: "carpentry", name: "Carpentry", icon: Hammer, color: "text-orange-600 bg-orange-50 border-orange-100 dark:bg-orange-950/40", count: 3 },
  { id: "painting", name: "Painting", icon: Paintbrush, color: "text-purple-600 bg-purple-50 border-purple-100 dark:bg-purple-950/40", count: 2 },
  { id: "cleaning", name: "Cleaning", icon: Sparkles, color: "text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-950/40", count: 4 },
  { id: "appliances", name: "Appliances", icon: Tv, color: "text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-950/40", count: 3 },
  { id: "masonry", name: "Masonry", icon: Building2, color: "text-slate-600 bg-slate-100 border-slate-200 dark:bg-slate-800", count: 2 },
];

const TOP_WORKERS = [
  {
    id: "worker-001",
    name: "Rajesh Kumar",
    trade: "Plumber & Pipe Specialist",
    rating: 4.9,
    reviewsCount: 184,
    distanceKm: 1.2,
    hourlyRate: 350,
    jobsCompleted: 312,
    isAvailable: true,
    skills: ["Leak Repair", "Drain Unclog", "Fixture Setup"],
  },
  {
    id: "worker-002",
    name: "Ramesh Singh",
    trade: "Master Electrician & Wireman",
    rating: 4.8,
    reviewsCount: 142,
    distanceKm: 2.1,
    hourlyRate: 400,
    jobsCompleted: 245,
    isAvailable: true,
    skills: ["Switchboard", "MCB Tripping", "Wiring"],
  },
  {
    id: "worker-003",
    name: "Amit Patel",
    trade: "Carpenter & Woodwork Expert",
    rating: 4.9,
    reviewsCount: 96,
    distanceKm: 2.8,
    hourlyRate: 450,
    jobsCompleted: 178,
    isAvailable: true,
    skills: ["Furniture Assembly", "Door Hinges", "Lock Fitting"],
  },
];

const MOCK_JOB_LEADS = [
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
    postedAt: "4 mins ago",
    customer: "Anand Verma",
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
    postedAt: "11 mins ago",
    customer: "Sneha Patil",
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
    postedAt: "25 mins ago",
    customer: "Vikram Sharma",
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
    postedAt: "38 mins ago",
    customer: "Rahul Mehta",
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
    customer: "Pooja Desai",
    description: "1.5 ton inverter AC drain tray overflowing inside room. Needs drain pipe unclog and filter clean.",
  },
  {
    id: "lead-106",
    title: "Balcony Ceiling Paint Peeling & Waterproofing",
    category: "painting",
    categoryLabel: "Painting",
    area: "Santacruz West, Mumbai",
    distanceKm: 4.8,
    payoutMin: 2200,
    payoutMax: 3200,
    urgency: "SCHEDULED",
    postedAt: "1 hr ago",
    customer: "Karan Tiwari",
    description: "Moisture patches on ceiling. Needs wire brushing, primer, and 2 coats of weather coat paint.",
  },
];

export default function HomePage() {
  const { t } = useTranslation();
  const [activeRole, setActiveRole] = useState<"customer" | "worker">("customer");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showDevAudit, setShowDevAudit] = useState(false);

  // Phase 1 verification demo states
  const [testInput, setTestInput] = useState("");
  const [testSwitch, setTestSwitch] = useState(true);
  const [testCheckbox, setTestCheckbox] = useState(true);

  // Filter jobs for worker mode
  const filteredJobs = MOCK_JOB_LEADS.filter((job) => {
    const matchesCategory = selectedCategory === "all" || job.category === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.area.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="py-4 sm:py-8 space-y-10 sm:space-y-12">
      <Container className="space-y-8">
        {/* Role Switcher Pill */}
        <div className="flex justify-center">
          <div className="inline-flex p-1 rounded-full bg-secondary border border-border/80 shadow-2xs">
            <button
              type="button"
              onClick={() => {
                setActiveRole("customer");
                setSelectedCategory("all");
              }}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                activeRole === "customer"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="h-4 w-4" />
              <span>{t("home.roleHire", "Hire Workers (Customer)")}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveRole("worker");
                setSelectedCategory("all");
              }}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                activeRole === "worker"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Briefcase className="h-4 w-4" />
              <span>{t("home.roleEarn", "Find Jobs & Earn (Worker)")}</span>
            </button>
          </div>
        </div>

        {/* ---------------------------------------------------- */}
        {/* VIEW 1: CUSTOMER VIEW (Hire Workers)                */}
        {/* ---------------------------------------------------- */}
        {activeRole === "customer" ? (
          <>
            {/* KaamBazaar Hero Navy Banner */}
            <div className="relative overflow-hidden rounded-3xl hero-navy-card p-6 sm:p-10 shadow-lg border border-primary/20">
              <div className="relative z-10 max-w-2xl space-y-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white border border-white/20 text-xs font-semibold backdrop-blur-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                  </span>
                  <span>120+ {t("home.statPros", "Verified Pros Active Nearby")}</span>
                </div>

                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">
                  {t("customer.bannerTitle", "Reliable Workers, Right Now.")}
                </h1>

                <p className="text-white/80 text-sm sm:text-base leading-relaxed">
                  {t("customer.bannerSub", "Connect with government ID verified plumbers, electricians, carpenters, and technicians. Upfront pricing, 15-minute response, and safe completion OTP.")}
                </p>

                {/* Hero Quick Search Box */}
                <div className="pt-2">
                  <div className="flex flex-col sm:flex-row gap-2 bg-white/10 p-2 rounded-2xl border border-white/20 backdrop-blur-md">
                    <div className="relative flex-1">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
                      <input
                        type="text"
                        placeholder={t("home.searchPlaceholder", "Search electrician, plumber, AC repair...")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-11 pl-10 pr-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                      />
                    </div>
                    <Button
                      asChild
                      className="bg-white text-[#162044] hover:bg-white/90 font-bold h-11 px-6 rounded-xl shadow-xs"
                    >
                      <Link href={`/customer/jobs/new${searchQuery ? `?query=${encodeURIComponent(searchQuery)}` : ""}`}>
                        {t("home.bookNow", "Book Now")}
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Quick Action Badges */}
                <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-white/70">
                  <span className="font-semibold text-white">Popular:</span>
                  <Link href="/customer/jobs/new?category=plumbing" className="hover:text-white underline-offset-4 hover:underline">
                    {t("category.plumbing", "Tap Leakage")}
                  </Link>
                  <span>•</span>
                  <Link href="/customer/jobs/new?category=electrical" className="hover:text-white underline-offset-4 hover:underline">
                    {t("category.electrical", "Ceiling Fan")}
                  </Link>
                  <span>•</span>
                  <Link href="/customer/jobs/new?category=appliances" className="hover:text-white underline-offset-4 hover:underline">
                    {t("category.appliances", "AC Servicing")}
                  </Link>
                  <span>•</span>
                  <Link href="/customer/jobs/new?category=carpentry" className="hover:text-white underline-offset-4 hover:underline">
                    {t("category.carpentry", "Lock Replacement")}
                  </Link>
                </div>
              </div>
            </div>

            {/* Service Categories Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    {t("home.exploreTrades", "Explore Services")}
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Select a trade category for instant nearby matching
                  </p>
                </div>
                <Link
                  href="/customer/jobs/new"
                  className="text-xs sm:text-sm font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <span>{t("home.allTrades", "View All")}</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <Link
                      key={cat.id}
                      href={`/customer/jobs/new?category=${cat.id}`}
                      className="group flex flex-col items-center justify-center p-4 rounded-2xl border border-border/70 bg-card hover:bg-muted/40 hover:border-primary/40 transition-all text-center bazaar-card-shadow"
                    >
                      <div className={`p-3.5 rounded-2xl mb-2.5 ${cat.color} group-hover:scale-110 transition-transform`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="text-sm font-bold text-foreground group-hover:text-primary">
                        {t(`category.${cat.id}`, cat.name)}
                      </span>
                      <span className="text-[10px] text-muted-foreground mt-0.5">
                        From ₹299
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Top Rated Verified Workers Nearby */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                      {t("home.verifiedProsTitle", "Top Rated Workers Nearby")}
                    </h2>
                    <Badge variant="success" className="text-[10px] py-0 px-2 font-bold">
                      {t("home.badgeVerified", "Verified")}
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {t("home.verifiedProsSub", "Background-checked professionals ready to accept jobs in Mumbai")}
                  </p>
                </div>
                <Link
                  href="/customer"
                  className="text-xs sm:text-sm font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <span>{t("home.allTrades", "See More")}</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {TOP_WORKERS.map((worker) => (
                  <Card key={worker.id} className="flex flex-col justify-between hover:border-primary/50 transition-all bazaar-card-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-extrabold text-base border-2 border-primary/20">
                              {worker.name.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-background" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-bold text-foreground text-sm sm:text-base">
                                {worker.name}
                              </h3>
                              <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1">{worker.trade}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-2 text-xs">
                        <div className="flex items-center gap-1 font-semibold text-foreground bg-amber-500/10 px-2 py-0.5 rounded-md text-amber-700 dark:text-amber-400">
                          <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                          <span>{worker.rating}</span>
                          <span className="text-muted-foreground font-normal">({worker.reviewsCount})</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-3 w-3 text-primary" />
                          <span>{worker.distanceKm} km</span>
                        </div>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">{worker.jobsCompleted} {t("nav.jobs", "jobs done")}</span>
                      </div>
                    </CardHeader>

                    <CardContent className="py-1">
                      <div className="flex flex-wrap gap-1.5">
                        {worker.skills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-[10px] font-medium border border-border/50"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </CardContent>

                    <div className="p-5 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] text-muted-foreground block">{t("home.payout", "Rate")}</span>
                        <PriceDisplay amount={worker.hourlyRate} rateType="hourly" className="font-bold text-sm text-foreground" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Button asChild variant="outline" size="sm" className="rounded-xl text-xs">
                          <Link href={`/workers/${worker.id}`}>{t("home.viewProfile", "Profile")}</Link>
                        </Button>
                        <Button asChild size="sm" className="rounded-xl text-xs font-bold">
                          <Link href={`/customer/jobs/new?workerId=${worker.id}`}>{t("home.bookNow", "Book Now")}</Link>
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* 4 Trust & Guarantee Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
              <Card className="p-5 flex items-start gap-3.5 border-border/80 bazaar-card-shadow">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-foreground">{t("home.trustBg", "Verified Workers")}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    100% Aadhaar verified tradespeople with verified ratings.
                  </p>
                </div>
              </Card>

              <Card className="p-5 flex items-start gap-3.5 border-border/80 bazaar-card-shadow">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950">
                  <Clock className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-foreground">{t("home.statDispatch", "Fast Matching")}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Nearby workers accept within 15 minutes of posting your job broadcast.
                  </p>
                </div>
              </Card>

              <Card className="p-5 flex items-start gap-3.5 border-border/80 bazaar-card-shadow">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-foreground">{t("home.trustPricing", "Transparent Pricing")}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Clear estimated ranges with no hidden platform fees or surge charges.
                  </p>
                </div>
              </Card>

              <Card className="p-5 flex items-start gap-3.5 border-border/80 bazaar-card-shadow">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-foreground">{t("home.trustOtp", "Safe OTP Completion")}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Escrow safety OTP ensures payment is released only after you verify the job.
                  </p>
                </div>
              </Card>
            </div>
          </>
        ) : (
          /* ---------------------------------------------------- */
          /* VIEW 2: WORKER VIEW (Find Jobs & Earn)              */
          /* ---------------------------------------------------- */
          <>
            {/* KaamBazaar Hero Navy Banner for Workers */}
            <div className="relative overflow-hidden rounded-3xl hero-navy-card p-6 sm:p-10 shadow-lg border border-primary/20">
              <div className="relative z-10 max-w-2xl space-y-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white border border-white/20 text-xs font-semibold backdrop-blur-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                  </span>
                  <span>18 {t("home.activeBroadcasts", "Live Job Leads Active Within 15km")}</span>
                </div>

                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">
                  {t("home.liveJobsTitle", "Browse Local Jobs, Get Paid Directly.")}
                </h1>

                <p className="text-white/80 text-sm sm:text-base leading-relaxed">
                  {t("home.liveJobsSub", "Connect with customers in Mumbai needing immediate skilled work. 0% middleman cut, transparent upfront payouts, and instant payment release.")}
                </p>

                {/* Search Jobs Input */}
                <div className="pt-2">
                  <div className="flex flex-col sm:flex-row gap-2 bg-white/10 p-2 rounded-2xl border border-white/20 backdrop-blur-md">
                    <div className="relative flex-1">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
                      <input
                        type="text"
                        placeholder={t("home.searchPlaceholder", "Search jobs by trade, task or area e.g. electrician, Andheri...")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-11 pl-10 pr-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                      />
                    </div>
                    <Button
                      asChild
                      className="bg-white text-[#162044] hover:bg-white/90 font-bold h-11 px-6 rounded-xl shadow-xs"
                    >
                      <Link href="/worker">
                        {t("worker.dashboard", "My Dashboard")}
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Quick Trade Filter Pills */}
                <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
                  <span className="font-semibold text-white mr-1">{t("home.exploreTrades", "Filter Trade")}:</span>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("all")}
                    className={`px-3 py-1 rounded-full font-bold transition-all ${
                      selectedCategory === "all"
                        ? "bg-white text-[#162044] shadow-xs"
                        : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                  >
                    {t("home.allTrades", "All")} ({MOCK_JOB_LEADS.length})
                  </button>
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-1 rounded-full font-semibold transition-all ${
                        selectedCategory === cat.id
                          ? "bg-white text-[#162044] shadow-xs font-bold"
                          : "bg-white/10 text-white hover:bg-white/20"
                      }`}
                    >
                      {t(`category.${cat.id}`, cat.name)} ({cat.count})
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Available Jobs Live Broadcasts Feed */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <BellRing className="h-5 w-5 text-primary" />
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                      {t("home.liveJobsTitle", "Available Jobs Nearby")}
                    </h2>
                    <Badge variant="default" className="text-[10px] py-0 px-2 font-bold rounded-full">
                      {filteredJobs.length} {t("worker.available", "Available")}
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {t("home.liveJobsSub", "Verified customer requests ready for offers within your 15km radius")}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button asChild variant="outline" size="sm" className="rounded-xl text-xs">
                    <Link href="/worker/offers">{t("nav.offers", "View All Offers")}</Link>
                  </Button>
                  <Button asChild size="sm" className="rounded-xl text-xs font-bold">
                    <Link href="/worker">{t("worker.dashboard", "Open Worker Console")}</Link>
                  </Button>
                </div>
              </div>

              {filteredJobs.length === 0 ? (
                <Card className="p-8 text-center rounded-3xl border-dashed">
                  <p className="text-sm text-muted-foreground">
                    No jobs match &ldquo;{searchQuery}&rdquo;. Try clearing filters or searching for another trade.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 rounded-xl"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("all");
                    }}
                  >
                    Reset Filters
                  </Button>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredJobs.map((job) => (
                    <Card key={job.id} className="flex flex-col justify-between hover:border-primary/50 transition-all rounded-2xl bazaar-card-shadow overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between mb-1.5">
                          <Badge
                            variant={
                              job.urgency === "IMMEDIATE"
                                ? "destructive"
                                : job.urgency === "URGENT"
                                ? "warning"
                                : "secondary"
                            }
                            className="text-[10px] rounded-full font-bold uppercase"
                          >
                            {job.urgency === "IMMEDIATE"
                              ? t("urgency.immediate", "Immediate Need")
                              : job.urgency === "URGENT"
                              ? t("urgency.urgent", "Urgent")
                              : t("urgency.today", "Today")}
                          </Badge>
                          <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{job.postedAt}</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] uppercase font-bold text-primary tracking-wider bg-primary/10 px-2 py-0.5 rounded-full">
                            {t(`category.${job.category}`, job.categoryLabel)}
                          </span>
                          <span className="text-xs text-muted-foreground">• {job.customer}</span>
                        </div>

                        <h3 className="font-bold text-foreground text-base leading-snug line-clamp-1">
                          {job.title}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {job.description}
                        </p>
                      </CardHeader>

                      <CardContent className="py-2">
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/80 text-xs">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="font-medium text-foreground">{job.distanceKm} km {t("home.distance", "away")}</span>
                          </div>
                          <div className="flex items-center gap-1 font-extrabold text-foreground text-sm">
                            <IndianRupee className="h-3.5 w-3.5 text-primary" />
                            <span>{job.payoutMin} - {job.payoutMax}</span>
                          </div>
                        </div>
                      </CardContent>

                      <div className="p-4 pt-2 border-t border-border/60 flex gap-2">
                        <Button asChild variant="outline" size="sm" className="flex-1 rounded-xl text-xs font-semibold">
                          <Link href={`/worker/offers/${job.id}`}>
                            {t("home.viewDetails", "View Details")}
                          </Link>
                        </Button>
                        <Button asChild size="sm" className="flex-1 rounded-xl text-xs font-bold shadow-xs">
                          <Link href={`/worker/offers/${job.id}`}>
                            {t("home.acceptLead", "Accept Lead")} <ArrowRight className="ml-1 h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Worker Benefits & Guarantees (Matching Screen 8 & 9) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
              <Card className="p-5 flex items-start gap-3.5 border-border/80 bazaar-card-shadow">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950">
                  <IndianRupee className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-foreground">{t("home.badgeZeroComm", "0% Middleman Cut")}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Keep 100% of your earnings on direct residential jobs with transparent fares.
                  </p>
                </div>
              </Card>

              <Card className="p-5 flex items-start gap-3.5 border-border/80 bazaar-card-shadow">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950">
                  <Radio className="h-5 w-5 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-foreground">{t("home.badgeGps", "15km Hyperlocal Radius")}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Broadcasted leads are filtered strictly to your chosen neighborhood in Mumbai.
                  </p>
                </div>
              </Card>

              <Card className="p-5 flex items-start gap-3.5 border-border/80 bazaar-card-shadow">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-foreground">{t("home.trustPricing", "Escrow Verified Pay")}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Customer confirms payment beforehand. Cash released upon OTP verification.
                  </p>
                </div>
              </Card>

              <Card className="p-5 flex items-start gap-3.5 border-border/80 bazaar-card-shadow">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950">
                  <Star className="h-5 w-5 text-purple-600" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-foreground">{t("home.statSat", "Build Reputation")}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Collect customer reviews and badges to rank higher on high-value contracts.
                  </p>
                </div>
              </Card>
            </div>
          </>
        )}

        {/* Portals Gateway */}
        <div className="rounded-3xl border border-border/80 bg-gradient-to-r from-primary/5 via-secondary/40 to-background p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 bazaar-card-shadow">
          <div className="space-y-1.5 text-center md:text-left">
            <h3 className="text-lg sm:text-xl font-bold text-foreground">
              {activeRole === "customer"
                ? "Are you a skilled trades professional?"
                : "Looking to hire a skilled tradesperson?"}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
              {activeRole === "customer"
                ? "Receive high-paying local jobs without middlemen fees. Build your verified reputation, track net earnings, and get paid instantly."
                : "Post your household task in 60 seconds. Nearby verified electricians, plumbers, carpenters and painters will respond immediately."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {activeRole === "customer" ? (
              <>
                <Button asChild variant="outline" className="rounded-xl px-5">
                  <Link href="/worker">{t("header.workerPortal", "Worker Dashboard")}</Link>
                </Button>
                <Button asChild className="rounded-xl px-5 font-bold">
                  <Link href="/onboarding">{t("header.earn", "Join as a Worker")}</Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="outline" className="rounded-xl px-5">
                  <Link href="/customer">{t("header.customerPortal", "Customer Portal")}</Link>
                </Button>
                <Button asChild className="rounded-xl px-5 font-bold">
                  <Link href="/customer/jobs/new">{t("customer.postJob", "Post a Job Request")}</Link>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Developer & Technical Primitives Drawer (Preserved from Phase 1) */}
        <div className="pt-6 border-t border-border/60">
          <button
            type="button"
            onClick={() => setShowDevAudit(!showDevAudit)}
            className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>{showDevAudit ? "Hide Technical Primitives Shelf" : "Show Technical Primitives Shelf (Design System & Contract Verification)"}</span>
          </button>

          {showDevAudit && (
            <div className="mt-6 space-y-6 animate-in fade-in duration-200">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-bold text-foreground">Phase 1 Primitives Verification</h4>
                </div>
                <p className="text-xs text-muted-foreground">
                  Interactive state tests for WCAG AA compliance, focus states, and domain components.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="p-4 space-y-3">
                  <span className="text-xs font-bold text-foreground">Form Controls</span>
                  <Input
                    placeholder="Search test input..."
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    helperText="Input test helper"
                  />
                  <Select defaultValue="mumbai">
                    <option value="mumbai">Mumbai Suburban</option>
                    <option value="pune">Pune Metro</option>
                  </Select>
                  <Progress value={75} />
                </Card>

                <Card className="p-4 space-y-3">
                  <span className="text-xs font-bold text-foreground">Accessible Toggles</span>
                  <Switch
                    id="dev-switch"
                    checked={testSwitch}
                    onCheckedChange={setTestSwitch}
                    label="Active Worker Toggle"
                  />
                  <Checkbox
                    id="dev-check"
                    checked={testCheckbox}
                    onChange={(e) => setTestCheckbox(e.target.checked)}
                    label="Verified Only Filter"
                  />
                </Card>
              </div>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
