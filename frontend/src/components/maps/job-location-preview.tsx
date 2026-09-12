"use client";

import { MapPin, Navigation, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface JobLocationPreviewProps {
  locality: string;
  city: string;
  addressLine?: string;
  landmark?: string;
  pincode?: string;
  latitude: number;
  longitude: number;
  isAssigned: boolean;
  distanceKm?: number;
  className?: string;
}

export function JobLocationPreview({
  locality,
  city,
  addressLine,
  landmark,
  pincode,
  latitude,
  longitude,
  isAssigned,
  distanceKm,
  className = "",
}: JobLocationPreviewProps) {
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

  return (
    <div className={`rounded-2xl border p-4 bg-card space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary shrink-0" />
          <h4 className="font-semibold text-sm text-foreground">Service Location</h4>
        </div>
        {isAssigned ? (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
            Address Unlocked
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-muted text-muted-foreground text-[10px] flex items-center gap-1">
            <Lock className="h-2.5 w-2.5" /> Approximate Area
          </Badge>
        )}
      </div>

      {isAssigned ? (
        <div className="space-y-2 text-xs">
          <div>
            <span className="font-bold text-sm text-foreground block">
              {addressLine || locality}
            </span>
            <p className="text-muted-foreground">
              {locality}, {city} {pincode ? `- ${pincode}` : ""}
            </p>
            {landmark && (
              <p className="text-muted-foreground mt-0.5">Landmark: {landmark}</p>
            )}
          </div>

          <Button asChild size="sm" variant="outline" className="w-full justify-center gap-1.5 mt-2">
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
              <Navigation className="h-3.5 w-3.5 text-primary" /> Start GPS Navigation
            </a>
          </Button>
        </div>
      ) : (
        <div className="space-y-2 text-xs">
          <p className="font-medium text-foreground">
            Around {locality}, {city}
          </p>
          {distanceKm !== undefined && (
            <p className="text-muted-foreground">
              Approximately {distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`} from your base area
            </p>
          )}
          <p className="text-[11px] text-muted-foreground bg-muted/30 p-2 rounded-lg">
            Exact house/building address will be unlocked immediately once this offer is accepted.
          </p>
        </div>
      )}
    </div>
  );
}
