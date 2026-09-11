import Link from "next/link";
import { UserX, HelpCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface SuspendedStateProps {
  reason?: string;
  supportEmail?: string;
}

export function SuspendedState({
  reason = "Your account has been temporarily suspended due to a compliance or verification review.",
  supportEmail = "support@kaamsetu.in",
}: SuspendedStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto rounded-xl border border-destructive/30 bg-destructive/5 shadow-xs">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4">
        <UserX className="h-7 w-7" />
      </div>

      <h3 className="text-xl font-bold text-foreground">Account Suspended</h3>
      <p className="mt-2 text-sm text-muted-foreground">{reason}</p>

      <div className="mt-6 rounded-lg border bg-background p-3 w-full text-xs text-muted-foreground flex items-center justify-center gap-2">
        <HelpCircle className="h-4 w-4 text-primary" />
        <span>Contact Support: <a href={`mailto:${supportEmail}`} className="font-semibold text-primary underline">{supportEmail}</a></span>
      </div>

      <div className="mt-6 flex gap-3">
        <Link href="/">
          <Button variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Return to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
