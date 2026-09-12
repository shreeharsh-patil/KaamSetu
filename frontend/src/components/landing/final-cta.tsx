"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, Zap, Users } from "lucide-react";

export function FinalCTA() {
  return (
    <section id="book-now" className="py-20 md:py-28 border-t border-border/60 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute inset-0 bg-radial from-blue-500/10 via-transparent to-transparent pointer-events-none -z-10" />

      <div className="max-w-[1280px] mx-auto px-6 md:px-12">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <Zap className="w-3.5 h-3.5" />
            15-Minute Hyperlocal Network
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-balance leading-tight">
            Have a home emergency? Get it resolved today.
          </h2>

          <p className="mt-6 text-muted-foreground text-base sm:text-lg leading-relaxed max-w-xl mx-auto">
            Join thousands of homeowners and verified technicians who use KaamSetu every day
            for rapid, trusted, escrow-protected home repairs.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <Link
              href="/customer/jobs/new"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white rounded-full transition-all hover:shadow-2xl relative overflow-hidden group"
              style={{
                background: "linear-gradient(135deg, #203eec 0%, #00d4ff 100%)",
                boxShadow: "0 8px 32px rgba(32, 62, 236, 0.4)",
              }}
            >
              <span className="relative z-10 inline-flex items-center gap-2">
                Book a Verified Technician
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
              {/* Glow overlay */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl bg-gradient-to-r from-[#203eec] to-[#00d4ff]" />
            </Link>

            <Link
              href="/worker"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold rounded-full border border-border hover:bg-secondary transition-colors text-foreground"
            >
              <Users className="w-4 h-4" />
              Join as Worker Partner
            </Link>
          </div>

          {/* Micro trust guarantees */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-xs text-muted-foreground font-medium">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Zero Upfront Commission
            </span>
            <span>•</span>
            <span>100% Escrow Protection</span>
            <span>•</span>
            <span>Aadhaar Verified Trades</span>
          </div>
        </div>
      </div>
    </section>
  );
}
