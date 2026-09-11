import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BellRing, IndianRupee, UserCheck } from "lucide-react";

export default function WorkerDashboardPage() {
  return (
    <AppShell
      title="Worker Portal"
      subtitle="Find nearby jobs, manage daily work availability, and view verified earnings."
      badge="Worker Shell"
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-dashed">
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <UserCheck className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Tradesperson Onboarding</CardTitle>
            </div>
            <CardDescription>
              Aadhaar KYC, trade certificate uploads, and service radius calibration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">Phase 5 Implementation</Badge>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <BellRing className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Nearby Job Alerts</CardTitle>
            </div>
            <CardDescription>
              Audio prompts and high-contrast job cards matching skills and travel distance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">Phase 6 Implementation</Badge>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <IndianRupee className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Daily Earnings & Ledger</CardTitle>
            </div>
            <CardDescription>
              Direct bank transfer status, material expense tracking, and net profit ledger.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">Phase 11 Implementation</Badge>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
