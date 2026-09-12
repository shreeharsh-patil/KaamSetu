"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, PhoneCall, CheckCircle2 } from "lucide-react";

interface HeroProps {
  activeRole?: "customer" | "worker";
  onSelectRole?: (role: "customer" | "worker") => void;
}

export function Hero({ activeRole = "customer", onSelectRole }: HeroProps) {
  const customerTitleText = "Connecting India's verified trades with AI intelligence";
  const workerTitleText = "Empowering skilled trades with direct jobs & daily payouts";
  
  const titleText = activeRole === "worker" ? workerTitleText : customerTitleText;
  const words = titleText.split(" ");

  const quickServices = [
    { label: "⚡ Electrician", query: "electrical" },
    { label: "🔧 Plumber", query: "plumbing" },
    { label: "🪚 Carpenter", query: "carpentry" },
    { label: "❄️ AC & Appliances", query: "appliances" },
    { label: "🎨 Painter", query: "painting" },
  ];

  return (
    <section className="min-h-[85vh] flex flex-col justify-center pt-24 md:pt-32 pb-16 relative overflow-hidden">
      {/* 3D Rotating Orb Background from ai-product-portfolio */}
      <div className="absolute -right-32 md:-right-48 top-20 md:top-28 w-[450px] h-[450px] md:w-[720px] md:h-[720px] pointer-events-none animate-orb-rotate -z-10 scale-125 opacity-90 dark:opacity-80">
        <Image
          src="/images/orb.png"
          alt=""
          width={720}
          height={720}
          className="w-full h-full object-contain"
          priority
        />
      </div>

      <div className="max-w-[1280px] mx-auto px-6 md:px-12 w-full">
        <div className="max-w-4xl">
          {/* Eyebrow / Brand tag */}
          <div className="flex items-center gap-3 mb-6">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide bg-secondary border border-border">
              <span className="h-2 w-2 rounded-full bg-[#00d4ff] animate-pulse" />
              <span>KaamSetu Platform</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">National Blue-Collar Protocol</span>
            </span>
          </div>

          {/* Main Title with Animated Words & AI Gradient */}
          <h1 className="text-4xl sm:text-6xl lg:text-[76px] font-semibold tracking-tight leading-[1.05] text-balance mb-8">
            {words.map((word, index) => (
              <span
                key={`${word}-${index}`}
                className={`hero-word inline-block font-sans font-semibold text-4xl sm:text-6xl lg:text-[76px] ${
                  word === "AI" ? "ai-gradient-word" : ""
                }`}
                style={{
                  animationDelay: `${index * 0.08}s`,
                  marginRight: index < words.length - 1 ? "0.26em" : "0",
                  ...(word === "AI"
                    ? {
                        background:
                          "linear-gradient(135deg, #ff006e 0%, #8b5cf6 33%, #203eec 66%, #00d4ff 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        filter:
                          "drop-shadow(0 0 20px rgba(255, 0, 110, 0.3)) drop-shadow(0 0 30px rgba(139, 92, 246, 0.3)) drop-shadow(0 0 40px rgba(0, 212, 255, 0.2))",
                      }
                    : {}),
                }}
              >
                {word}
              </span>
            ))}
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl leading-relaxed text-base sm:text-lg text-muted-foreground mb-10">
            {activeRole === "customer"
              ? "Book background-verified electricians, plumbers, carpenters, and technicians near you in 60 seconds. Guaranteed work, upfront standardized rate cards, and multilingual voice booking."
              : "Direct customer leads without commission cuts. Guaranteed instant UPI payouts, Aadhaar-verified badge, and jobs matched strictly in your preferred pin codes."}
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-12">
            {activeRole === "customer" ? (
              <>
                <Link
                  href="/customer/jobs/new"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white rounded-full transition-all relative overflow-hidden group shadow-xl"
                  style={{
                    background: "linear-gradient(135deg, #203eec 0%, #00d4ff 100%)",
                    boxShadow: "0 8px 30px rgba(32, 62, 236, 0.35)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow =
                      "0 12px 35px rgba(32, 62, 236, 0.5), 0 0 40px rgba(0, 212, 255, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "0 8px 30px rgba(32, 62, 236, 0.35)";
                  }}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Book a Technician Now
                    <ArrowUpRight className="w-5 h-5" />
                  </span>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl bg-gradient-to-r from-[#203eec] to-[#00d4ff]" />
                </Link>

                <Link
                  href="/voice-ai"
                  className="inline-flex items-center justify-center gap-2 px-6 py-4 text-base font-medium rounded-full border border-border bg-card hover:bg-secondary transition-all"
                >
                  <PhoneCall className="w-4 h-4 text-[#203eec]" />
                  <span>Voice Booking (बोलकर बुक करें)</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/worker"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white rounded-full transition-all relative overflow-hidden group shadow-xl"
                  style={{
                    background: "linear-gradient(135deg, #203eec 0%, #00d4ff 100%)",
                    boxShadow: "0 8px 30px rgba(32, 62, 236, 0.35)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow =
                      "0 12px 35px rgba(32, 62, 236, 0.5), 0 0 40px rgba(0, 212, 255, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "0 8px 30px rgba(32, 62, 236, 0.35)";
                  }}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Join as Worker • Start Earning
                    <ArrowUpRight className="w-5 h-5" />
                  </span>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl bg-gradient-to-r from-[#203eec] to-[#00d4ff]" />
                </Link>

                <Link
                  href="/customer"
                  onClick={() => onSelectRole?.("customer")}
                  className="inline-flex items-center justify-center gap-2 px-6 py-4 text-base font-medium rounded-full border border-border bg-card hover:bg-secondary transition-all"
                >
                  <span>Switch to Hire Workers</span>
                </Link>
              </>
            )}
          </div>

          {/* Quick Trade Badges */}
          {activeRole === "customer" && (
            <div className="pt-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                In-Demand Services Near You
              </p>
              <div className="flex flex-wrap gap-2">
                {quickServices.map((service) => (
                  <Link
                    key={service.label}
                    href={`/customer/jobs/new?trade=${service.query}`}
                    className="px-3.5 py-1.5 text-xs font-medium border border-border rounded-full hover:bg-secondary hover:border-foreground/30 transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <span>{service.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Trust Guarantees Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 pt-8 border-t border-border">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-[#203eec] shrink-0" />
              <div className="text-xs">
                <p className="font-semibold text-foreground">100% Aadhaar</p>
                <p className="text-muted-foreground">Identity Verified</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-[#00d4ff] shrink-0" />
              <div className="text-xs">
                <p className="font-semibold text-foreground">Standard Rates</p>
                <p className="text-muted-foreground">No Hidden Charges</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-[#203eec] shrink-0" />
              <div className="text-xs">
                <p className="font-semibold text-foreground">Escrow Payouts</p>
                <p className="text-muted-foreground">Pay After Work Done</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-[#00d4ff] shrink-0" />
              <div className="text-xs">
                <p className="font-semibold text-foreground">30-Day Guarantee</p>
                <p className="text-muted-foreground">Free Re-service</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
