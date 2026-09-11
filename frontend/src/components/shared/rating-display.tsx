import { Star, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RatingDisplayProps {
  rating: number;
  totalReviews?: number;
  isVerified?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function RatingDisplay({
  rating,
  totalReviews,
  isVerified,
  size = "md",
  className,
}: RatingDisplayProps) {
  const sizeClasses = {
    sm: "text-xs gap-1",
    md: "text-sm gap-1.5",
    lg: "text-base gap-2",
  };

  const starSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <div
      className={cn("inline-flex items-center", sizeClasses[size], className)}
      aria-label={`Rating: ${rating.toFixed(1)} out of 5 stars ${totalReviews ? `from ${totalReviews} reviews` : ""}`}
    >
      <div className="flex items-center text-amber-500">
        <Star className={cn("fill-amber-400 stroke-amber-500", starSizes[size])} />
        <span className="ml-1 font-bold text-foreground">
          {rating.toFixed(1)}
        </span>
      </div>

      {totalReviews !== undefined && (
        <span className="text-muted-foreground text-xs">
          ({totalReviews})
        </span>
      )}

      {isVerified && (
        <span
          className="inline-flex items-center gap-0.5 text-xs text-emerald-700 dark:text-emerald-400 font-medium"
          title="Verified Skilled Tradesperson"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Verified</span>
        </span>
      )}
    </div>
  );
}
