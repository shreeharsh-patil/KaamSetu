"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, User as UserIcon, ChevronUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/features/auth/use-auth";
import { cn } from "@/lib/utils";

/** Mask phone: keep country code + last 4, e.g. "+91 ••••• 8472". */
function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const last4 = digits.slice(-4);
  const countryCode = digits.length > 10 ? `+${digits.slice(0, digits.length - 10)}` : "+91";
  return `${countryCode} ••••• ${last4}`;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p.charAt(0).toUpperCase()).join("") || "U";
}

export interface SidebarAccountProps {
  collapsed: boolean;
  onNavigate?: () => void;
}

/**
 * Account summary footer: avatar, name, masked phone. Opens a small popover
 * with Profile link and Logout. Collapsed mode shows just the avatar with a
 * tooltip-equivalent aria-label.
 */
export function SidebarAccount({ collapsed, onNavigate }: SidebarAccountProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const displayName = user?.fullName?.trim() || "Account";
  const maskedPhone = user ? maskPhone(user.phoneNumber) : "";

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!user) return null;

  const handleLogout = async () => {
    setOpen(false);
    onNavigate?.();
    await logout();
    router.push("/login");
  };

  if (collapsed) {
    return (
      <div className="flex justify-center py-2" ref={containerRef}>
        <button
          type="button"
          onClick={handleLogout}
          aria-label={`Log out (${displayName})`}
          className="flex h-9 w-9 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring hover:opacity-80"
        >
          <Avatar className="h-8 w-8 border">
            <AvatarImage src={user.profilePhotoUrl ?? undefined} alt="" />
            <AvatarFallback className="text-[11px] font-semibold">
              {initialsOf(displayName)}
            </AvatarFallback>
          </Avatar>
        </button>
      </div>
    );
  }

  return (
    <div className="relative px-3 py-2" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          "flex w-full items-center gap-2.5 rounded-lg p-2 text-left transition-colors outline-none",
          "hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
          open && "bg-muted"
        )}
      >
        <Avatar className="h-8 w-8 border shrink-0">
          <AvatarImage src={user.profilePhotoUrl ?? undefined} alt="" />
          <AvatarFallback className="text-[11px] font-semibold">
            {initialsOf(displayName)}
          </AvatarFallback>
        </Avatar>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-semibold text-foreground">
            {displayName}
          </span>
          <span className="block truncate text-[11px] text-muted-foreground">
            {maskedPhone}
          </span>
        </span>
        <ChevronUp
          className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account menu"
          className="absolute bottom-full left-3 right-3 z-50 mb-2 overflow-hidden rounded-lg border border-border bg-background shadow-md"
        >
          <Link
            href={user.role === "WORKER" ? "/worker/profile" : user.role === "ADMIN" || user.role === "SUPPORT" ? "/admin" : "/customer/profile"}
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onNavigate?.();
            }}
            className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted outline-none focus-visible:bg-muted"
          >
            <UserIcon className="h-4 w-4 text-muted-foreground" aria-hidden />
            Profile
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 border-t border-border px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/5 outline-none focus-visible:bg-destructive/5"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
