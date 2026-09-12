"use client";

const PARTNERS = [
  "NPCI UPI",
  "DigiLocker",
  "Razorpay",
  "ONDC Network",
  "AWS Cloud",
  "MongoDB Atlas",
  "Redis Enterprise",
  "Aadhaar Auth",
  "ISO 27001",
];

export function ClientLogos() {
  return (
    <section className="py-12 border-y border-border/60 overflow-hidden bg-muted/20">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <p className="text-xs sm:text-sm font-semibold text-muted-foreground text-center uppercase tracking-wider">
          Secured by Industry-Leading Infrastructure & Protocols
        </p>
      </div>

      {/* Marquee Container */}
      <div className="relative">
        <div className="flex animate-marquee hover:[animation-play-state:paused]">
          {[...PARTNERS, ...PARTNERS].map((partner, index) => (
            <div
              key={`${partner}-${index}`}
              className="flex items-center justify-center min-w-[180px] md:min-w-[220px] px-6"
            >
              <span className="text-xl md:text-2xl font-bold tracking-tight text-muted-foreground/40 hover:text-foreground transition-colors cursor-default whitespace-nowrap">
                {partner}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
