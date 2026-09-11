import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, UserCheck, AlertOctagon } from "lucide-react";

export default function AdminDashboardPage() {
  return (
    <AppShell
      title="Admin Operations Console"
      subtitle="Manage trade identity verifications, dispute resolutions, and platform health."
      badge="Admin Shell"
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-dashed">
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <UserCheck className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Worker Approvals</CardTitle>
            </div>
            <CardDescription>
              Review Aadhaar credentials, trade certificates, and police verifications.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">Phase 17 Implementation</Badge>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <AlertOctagon className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Dispute Resolution</CardTitle>
            </div>
            <CardDescription>
              Mediate pricing conflicts, incomplete work claims, and audit logs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">Phase 17 Implementation</Badge>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Safety & Fraud Audit</CardTitle>
            </div>
            <CardDescription>
              Monitor suspicious job postings, collusion attempts, and payout anomalies.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">Phase 17 Implementation</Badge>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
