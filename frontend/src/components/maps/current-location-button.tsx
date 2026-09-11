"use client";

import { useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface CurrentLocationButtonProps {
  onLocationFound: (coords: { latitude: number; longitude: number }) => void;
  className?: string;
}

export function CurrentLocationButton({
  onLocationFound,
  className,
}: CurrentLocationButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDetect = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoading(false);
        onLocationFound({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      (err) => {
        setLoading(false);
        setError(`Could not retrieve GPS coordinates: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  return (
    <div className="space-y-1 w-full">
      <Button
        type="button"
        variant="outline"
        onClick={handleDetect}
        disabled={loading}
        className={`w-full justify-center gap-2 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary ${className}`}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Detecting Your GPS Location...
          </>
        ) : (
          <>
            <MapPin className="h-4 w-4" /> Use My Current Location
          </>
        )}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
