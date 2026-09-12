import { ShieldCheck, UserCheck, Star, Clock, Lock } from "lucide-react";
import { SectionTitle } from "@/components/landing/section-title";

const TRUST_PILLARS = [
  {
    title: "Secure Account Authentication",
    description: "Passwordless OTP authentication ensures verified customer and worker identity on every login.",
    tag: "Security",
    icon: Lock,
  },
  {
    title: "Trade Credential & Document Verification",
    description: "Technicians submit government ID and trade certification records for administrative review.",
    tag: "Verification",
    icon: UserCheck,
  },
  {
    title: "Real Reviews from Completed Work",
    description: "Ratings and feedback can only be submitted after a verified, completed service assignment.",
    tag: "Accountability",
    icon: Star,
  },
  {
    title: "Transparent Job Lifecycle Tracking",
    description: "Monitor real progress states from assignment and travel through arrival and task completion.",
    tag: "Visibility",
    icon: Clock,
  },
  {
    title: "Strict Location & Contact Privacy",
    description: "Personal contact details and exact addresses are shielded until a job offer is accepted.",
    tag: "Privacy",
    icon: ShieldCheck,
  },
];

export function TrustGuarantees() {
  return (
    <section id="trust" className="py-16 md:py-24 border-t border-border/60">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#203eec] dark:text-blue-400">
            Trust & Safety
          </span>
          <SectionTitle className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight mt-2 text-balance">
            Built on Real Safeguards
          </SectionTitle>
          <p className="mt-4 text-muted-foreground text-base sm:text-lg leading-relaxed">
            Our platform design protects both homeowners and skilled technicians at every step.
          </p>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TRUST_PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="p-6 rounded-xl border border-border/80 bg-card hover:border-border transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground">
                      {pillar.tag}
                    </span>
                    <div className="w-9 h-9 rounded-lg bg-[#203eec]/10 text-[#203eec] dark:text-blue-400 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {pillar.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
