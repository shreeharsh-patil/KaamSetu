import Link from "next/link";
import { Lock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ForbiddenStateProps {
  title?: string;
  description?: string;
  requiredRole?: string;
}

export function ForbiddenState({
  title = "Access Denied",
  description = "Your current account role does not have permission to view this section.",
  requiredRole,
}: ForbiddenStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto rounded-xl border bg-card shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4">
        <Lock className="h-6 w-6" />
      </div>

      <h3 className="text-xl font-bold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>

      {requiredRole && (
        <p className="mt-2 text-xs font-medium text-muted-foreground">
          Required access tier: <span className="font-semibold text-foreground uppercase">{requiredRole}</span>
        </p>
      )}

      <div className="mt-6 flex gap-3">
        <Link href="/">
          <Button variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Return Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
