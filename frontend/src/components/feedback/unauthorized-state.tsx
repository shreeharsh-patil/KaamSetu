import Link from "next/link";
import { ShieldAlert, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface UnauthorizedStateProps {
  title?: string;
  description?: string;
  loginUrl?: string;
}

export function UnauthorizedState({
  title = "Authentication Required",
  description = "You must sign in with your verified phone number to access this page.",
  loginUrl = "/login",
}: UnauthorizedStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto rounded-xl border bg-card shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 mb-4">
        <ShieldAlert className="h-6 w-6" />
      </div>

      <h3 className="text-xl font-bold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>

      <div className="mt-6 flex gap-3">
        <Link href={loginUrl}>
          <Button leftIcon={<LogIn className="h-4 w-4" />}>
            Sign In with Phone
          </Button>
        </Link>
      </div>
    </div>
  );
}
