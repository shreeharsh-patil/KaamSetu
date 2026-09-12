import { SectionTitle } from "@/components/landing/section-title";
import { ClipboardList, MapPin, CheckCircle2, UserCheck, BellRing, TrendingUp } from "lucide-react";

const CUSTOMER_STEPS = [
  {
    step: "1",
    title: "Describe the Work",
    description:
      "Select your service category, describe what needs fixing, or use voice input to detail the task.",
    icon: ClipboardList,
  },
  {
    step: "2",
    title: "Get Matched Nearby",
    description:
      "Your request is dispatched to verified workers in your immediate vicinity based on skill and distance.",
    icon: MapPin,
  },
  {
    step: "3",
    title: "Track & Review",
    description:
      "Monitor status as the worker travels and completes the task. Inspect the work and leave a genuine review.",
    icon: CheckCircle2,
  },
];

const WORKER_STEPS = [
  {
    step: "1",
    title: "Create Profile",
    description:
      "Enroll with your specific trade skills, operational radius, and submit credentials for verification.",
    icon: UserCheck,
  },
  {
    step: "2",
    title: "Receive Nearby Offers",
    description:
      "Get real-time job notifications within your active area. Review estimated amounts and accept jobs you want.",
    icon: BellRing,
  },
  {
    step: "3",
    title: "Complete & Track Earnings",
    description:
      "Update job progress directly in the app, log work expenses, and monitor daily and weekly net earnings.",
    icon: TrendingUp,
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 md:py-24 border-t border-border/60">
      <div className="max-w-[1280px] mx-auto px-6 md:px-12">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#203eec] dark:text-blue-400">
            Simple & Transparent
          </span>
          <SectionTitle className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight mt-2 text-balance">
            How KaamSetu Works
          </SectionTitle>
          <p className="mt-4 text-muted-foreground text-base sm:text-lg leading-relaxed">
            A direct, reliable workflow connecting local households with qualified tradespeople.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* For Customers */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3 pb-2 border-b border-border/60">
              <span className="px-3 py-1 text-xs font-semibold rounded-md bg-[#203eec]/10 text-[#203eec] dark:text-blue-400">
                For Customers
              </span>
              <h3 className="text-xl font-semibold text-foreground">Getting work done</h3>
            </div>

            <div className="flex flex-col gap-4">
              {CUSTOMER_STEPS.map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.step}
                    className="flex items-start gap-4 p-5 rounded-xl border border-border/80 bg-card hover:border-[#203eec]/40 transition-colors"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#203eec]/10 text-[#203eec] dark:text-blue-400 flex items-center justify-center font-semibold text-sm">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-muted-foreground">Step {step.step}</span>
                        <span className="text-muted-foreground/40">•</span>
                        <h4 className="text-base font-semibold text-foreground">{step.title}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* For Workers */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3 pb-2 border-b border-border/60">
              <span className="px-3 py-1 text-xs font-semibold rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                For Workers
              </span>
              <h3 className="text-xl font-semibold text-foreground">Finding and managing jobs</h3>
            </div>

            <div className="flex flex-col gap-4">
              {WORKER_STEPS.map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.step}
                    className="flex items-start gap-4 p-5 rounded-xl border border-border/80 bg-card hover:border-emerald-500/40 transition-colors"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-semibold text-sm">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-muted-foreground">Step {step.step}</span>
                        <span className="text-muted-foreground/40">•</span>
                        <h4 className="text-base font-semibold text-foreground">{step.title}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
