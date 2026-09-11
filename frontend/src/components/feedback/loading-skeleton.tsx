import { Skeleton } from "@/components/ui/skeleton";
import { Container } from "@/components/layout/container";

export function LoadingSkeleton() {
  return (
    <div className="py-8 w-full" aria-busy="true" aria-live="polite">
      <Container className="space-y-6">
        {/* Header skeleton */}
        <div className="space-y-2 border-b pb-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>

        {/* Content grid skeleton */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border p-5 space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-9 w-28 mt-4" />
          </div>
          <div className="rounded-lg border p-5 space-y-3">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-9 w-28 mt-4" />
          </div>
          <div className="rounded-lg border p-5 space-y-3 sm:col-span-2 lg:col-span-1">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-9 w-28 mt-4" />
          </div>
        </div>
      </Container>
    </div>
  );
}
