import Link from "next/link";
import { ArrowRight, UserPlus, ShieldCheck, Clock, CheckCircle2 } from "lucide-react";
import { SectionTitle } from "@/components/landing/section-title";

export function FinalCTA() {
  return (
    <section id="book-now" className="py-20 md:py-24 border-t border-border/60 bg-secondary/30">
      <div className="max-w-[1280px] mx-auto px-6 md:px-12">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#203eec]/10 text-[#203eec] dark:text-blue-400 text-xs font-semibold uppercase tracking-wider mb-6">
            Get Started Today
          </span>

          <SectionTitle className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground text-balance leading-tight">
            Ready to get quality work done?
          </SectionTitle>

          <p className="mt-4 text-muted-foreground text-base sm:text-lg leading-relaxed max-w-xl mx-auto">
            Book local electricians, plumbers, carpenters, and technicians nearby, or enroll as a verified worker partner to grow your trade.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            <Link
              href="/customer/jobs/new"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-[#162044] hover:bg-[#203eec] dark:bg-blue-600 dark:hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
            >
              Book a Service
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/worker"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-foreground bg-background hover:bg-secondary border border-border rounded-lg transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Register as Worker
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-xs text-muted-foreground font-medium">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Verified Technician Profiles
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#203eec] dark:text-blue-400" />
              Fast Local Dispatch
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Transparent Job History
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
