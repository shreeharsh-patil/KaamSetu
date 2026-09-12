"use client";

import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JobCreationWizard } from "@/features/customer/components/job-creation-wizard";

export default function NewJobPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/customer">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Post a Service Request</h1>
          <p className="text-xs text-muted-foreground">
            Takes less than 60 seconds to find nearby verified professionals
          </p>
        </div>
      </div>

      <Suspense fallback={<div className="h-96 rounded-2xl bg-muted/40 animate-pulse" />}>
        <JobCreationWizard />
      </Suspense>
    </div>
  );
}
