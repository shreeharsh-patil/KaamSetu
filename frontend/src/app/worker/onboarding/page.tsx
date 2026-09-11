import { Container } from "@/components/layout/container";
import { OnboardingWizard } from "@/features/workers/components/onboarding-wizard";

export default function WorkerOnboardingPage() {
  return (
    <div className="py-8 sm:py-12">
      <Container size="sm">
        <OnboardingWizard />
      </Container>
    </div>
  );
}
