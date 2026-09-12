"use client";

import { MapPin, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface ServiceRadiusMapProps {
  radiusKm: number;
  onRadiusChange?: (km: number) => void;
  centerLocality?: string;
  className?: string;
}

const RADIUS_OPTIONS = [2, 5, 10, 15, 25];

export function ServiceRadiusMap({
  radiusKm,
  onRadiusChange,
  centerLocality = "Selected Base Location",
  className = "",
}: ServiceRadiusMapProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Visual Radius Simulation Canvas */}
      <div className="relative w-full aspect-video rounded-2xl bg-slate-900 border border-border/50 overflow-hidden flex items-center justify-center p-6 text-white shadow-inner">
        {/* Concentric rings */}
        <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
          <div className="w-72 h-72 rounded-full border border-primary animate-pulse" />
          <div className="w-48 h-48 rounded-full border border-primary/60" />
          <div className="w-24 h-24 rounded-full border border-primary/80" />
        </div>

        {/* Center pin */}
        <div className="relative z-10 text-center space-y-1">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center mx-auto text-primary-foreground shadow-lg">
            <MapPin className="h-5 w-5" />
          </div>
          <span className="font-bold text-xs block text-white drop-shadow">
            {centerLocality}
          </span>
          <Badge variant="outline" className="bg-black/60 text-white border-white/20 text-[10px]">
            {radiusKm} km Service Radius
          </Badge>
        </div>

        <div className="absolute bottom-2 right-2 text-[10px] text-white/50 flex items-center gap-1">
          <Shield className="h-3 w-3" /> Broadcast Coverage
        </div>
      </div>

      {/* Radius Selector Pills */}
      {onRadiusChange && (
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">Select Operating Radius:</label>
          <div className="grid grid-cols-5 gap-2">
            {RADIUS_OPTIONS.map((km) => (
              <button
                key={km}
                type="button"
                onClick={() => onRadiusChange(km)}
                className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all border ${
                  radiusKm === km
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-muted/40 border-border hover:bg-muted text-foreground"
                }`}
              >
                {km} km
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
