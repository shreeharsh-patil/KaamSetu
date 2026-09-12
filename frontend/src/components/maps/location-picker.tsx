"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CurrentLocationButton } from "./current-location-button";

export interface LocationPickerProps {
  initialLatitude?: number;
  initialLongitude?: number;
  onLocationChange: (location: {
    latitude: number;
    longitude: number;
    locality?: string;
  }) => void;
  className?: string;
}

export function LocationPicker({
  initialLatitude = 19.076,
  initialLongitude = 72.8777,
  onLocationChange,
  className = "",
}: LocationPickerProps) {
  const [lat, setLat] = useState(initialLatitude);
  const [lng, setLng] = useState(initialLongitude);
  const [locality, setLocality] = useState("");

  const handleGpsFound = (coords: { latitude: number; longitude: number }) => {
    setLat(coords.latitude);
    setLng(coords.longitude);
    onLocationChange({
      latitude: coords.latitude,
      longitude: coords.longitude,
      locality: locality || "GPS Detected Location",
    });
  };

  return (
    <div className={`space-y-4 rounded-2xl border p-4 bg-card ${className}`}>
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-primary" />
        <h4 className="font-semibold text-sm text-foreground">Pin Location on Map</h4>
      </div>

      <CurrentLocationButton onLocationFound={handleGpsFound} />

      <div className="space-y-1">
        <label className="text-xs font-medium text-foreground">Locality / Landmark Name</label>
        <Input
          placeholder="e.g. Bandra West, Station Road"
          value={locality}
          onChange={(e) => {
            setLocality(e.target.value);
            onLocationChange({
              latitude: lat,
              longitude: lng,
              locality: e.target.value,
            });
          }}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-lg font-mono">
        <div>Lat: {lat.toFixed(5)}</div>
        <div>Lng: {lng.toFixed(5)}</div>
      </div>
    </div>
  );
}
