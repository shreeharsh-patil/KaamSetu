import Link from "next/link";
import { UserCheck, ArrowRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface IncompleteOnboardingStateProps {
  role?: "worker" | "customer";
  onboardingUrl?: string;
}

export function IncompleteOnboardingState({
  role = "worker",
  onboardingUrl = "/worker/onboarding",
}: IncompleteOnboardingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto rounded-xl border border-primary/20 bg-primary/5 shadow-xs">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
        <UserCheck className="h-7 w-7" />
      </div>

      <h3 className="text-xl font-bold text-foreground">Complete Your Registration</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        {role === "worker"
          ? "Please complete your trade skills, service area, and identity verification before receiving local job opportunities."
          : "Please set your home service address and contact details to request skilled tradespeople."}
      </p>

      <div className="mt-6 flex flex-col gap-2 w-full">
        <Link href={onboardingUrl} className="w-full">
          <Button className="w-full" rightIcon={<ArrowRight className="h-4 w-4" />}>
            Continue Onboarding
          </Button>
        </Link>
        <Link href="/" className="w-full">
          <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground" leftIcon={<FileText className="h-3.5 w-3.5" />}>
            Explore Platform First
          </Button>
        </Link>
      </div>
    </div>
  );
}
