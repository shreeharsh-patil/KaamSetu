import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DistanceDisplayProps {
  distanceKm: number;
  areaName?: string;
  className?: string;
}

export function DistanceDisplay({
  distanceKm,
  areaName,
  className,
}: DistanceDisplayProps) {
  const formatted =
    distanceKm < 1
      ? `${Math.round(distanceKm * 1000)} m away`
      : `${distanceKm.toFixed(1)} km away`;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs text-muted-foreground font-medium",
        className
      )}
    >
      <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
      <span>{formatted}</span>
      {areaName && (
        <>
          <span>•</span>
          <span className="truncate max-w-[150px]">{areaName}</span>
        </>
      )}
    </span>
  );
}
