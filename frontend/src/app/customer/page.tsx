import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Clock, Mic } from "lucide-react";

export default function CustomerDashboardPage() {
  return (
    <AppShell
      title="Customer Portal"
      subtitle="Discover tradespeople, request immediate help, and manage active service jobs."
      badge="Customer Shell"
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-dashed">
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <PlusCircle className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Job Creation</CardTitle>
            </div>
            <CardDescription>
              Voice-first or one-tap category selection for immediate service assistance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">Phase 7 Implementation</Badge>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Active Jobs & Quotes</CardTitle>
            </div>
            <CardDescription>
              Review bids, real-time arrival estimates, OTP completion codes, and payments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">Phase 8 & 9 Implementation</Badge>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <Mic className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Voice Assistant</CardTitle>
            </div>
            <CardDescription>
              Describe trade issues in Hindi, Marathi, Tamil or English with automated classification.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">Phase 14 Implementation</Badge>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
