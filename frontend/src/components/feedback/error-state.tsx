import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  digest?: string;
  onRetry?: () => void;
  actionText?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message = "We encountered an unexpected error while loading this content. Please try again.",
  digest,
  onRetry,
  actionText = "Try again",
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto rounded-xl border border-destructive/20 bg-destructive/5"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4">
        <AlertTriangle className="h-6 w-6" />
      </div>

      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>

      {digest && (
        <p className="mt-2 text-xs font-mono text-muted-foreground/80 bg-muted px-2 py-1 rounded">
          Error ID: {digest}
        </p>
      )}

      {onRetry && (
        <div className="mt-6">
          <Button
            onClick={onRetry}
            variant="default"
            size="sm"
            leftIcon={<RefreshCw className="h-4 w-4" />}
          >
            {actionText}
          </Button>
        </div>
      )}
    </div>
  );
}
