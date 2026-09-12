import { CheckCircle2, Clock, Car, Wrench, Check } from "lucide-react";
import type { JobStatus } from "@/features/jobs/types";
import { cn } from "@/lib/utils";

interface JobTimelineProps {
  status: JobStatus;
  className?: string;
}

const STEPS: { status: JobStatus; label: string; icon: typeof Clock }[] = [
  { status: "ACCEPTED", label: "Assigned", icon: CheckCircle2 },
  { status: "EN_ROUTE", label: "En Route", icon: Car },
  { status: "ARRIVED", label: "Arrived", icon: Check },
  { status: "IN_PROGRESS", label: "In Progress", icon: Wrench },
  { status: "COMPLETED", label: "Completed", icon: CheckCircle2 },
];

const STATUS_ORDER: Record<string, number> = {
  DRAFT: 0,
  OPEN: 0,
  MATCHING: 0,
  OFFERED: 0,
  ACCEPTED: 1,
  EN_ROUTE: 2,
  ARRIVED: 3,
  IN_PROGRESS: 4,
  COMPLETED: 5,
  CANCELLED: -1,
  EXPIRED: -1,
  DISPUTED: -2,
};

export function JobTimeline({ status, className }: JobTimelineProps) {
  const currentStepIndex = STATUS_ORDER[status] ?? 0;

  if (status === "CANCELLED" || status === "EXPIRED" || status === "DISPUTED") {
    return (
      <div className={cn("p-4 rounded-xl border border-destructive/20 bg-destructive/5 text-center", className)}>
        <span className="font-semibold text-sm text-destructive uppercase tracking-wider">
          Job {status}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("w-full py-4", className)}>
      <div className="flex items-center justify-between relative">
        {/* Connecting line */}
        <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-1 bg-muted -z-0" />
        <div
          className="absolute top-1/2 left-4 -translate-y-1/2 h-1 bg-primary transition-all duration-500 -z-0"
          style={{
            width: `${Math.min(100, Math.max(0, ((currentStepIndex - 1) / (STEPS.length - 1)) * 100))}%`,
          }}
        />

        {STEPS.map((step, index) => {
          const stepNum = index + 1;
          const isDone = currentStepIndex > stepNum;
          const isCurrent = currentStepIndex === stepNum;
          const Icon = step.icon;

          return (
            <div key={step.status} className="flex flex-col items-center gap-1.5 z-10">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all text-xs font-bold",
                  isDone
                    ? "bg-primary border-primary text-primary-foreground"
                    : isCurrent
                    ? "bg-background border-primary text-primary ring-4 ring-primary/20 scale-110"
                    : "bg-background border-muted text-muted-foreground"
                )}
              >
                {isDone ? <Check className="h-4 w-4 stroke-[3]" /> : <Icon className="h-4 w-4" />}
              </div>
              <span
                className={cn(
                  "text-[11px] font-medium transition-colors text-center hidden sm:block",
                  isCurrent ? "text-primary font-bold" : isDone ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
