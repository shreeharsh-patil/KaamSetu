import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DistanceDisplayProps {
  distanceKm?: number;
  meters?: number;
  areaName?: string;
  className?: string;
}

export function DistanceDisplay({
  distanceKm,
  meters,
  areaName,
  className,
}: DistanceDisplayProps) {
  const effectiveKm =
    distanceKm !== undefined
      ? distanceKm
      : meters !== undefined
      ? meters / 1000
      : 0;

  const formatted =
    effectiveKm < 1
      ? `${Math.round(effectiveKm * 1000)} m away`
      : `${effectiveKm.toFixed(1)} km away`;

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
