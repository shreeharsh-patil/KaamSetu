"use client";

import {
  User as UserIcon,
  Phone,
  Mail,
  Globe,
  Calendar,
  ShieldCheck,
  ChevronRight,
  MapPin,
  CreditCard,
  LogOut,
  Edit3,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { useAuth } from "@/features/auth/use-auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CustomerProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  if (!user) return null;

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title="My Profile"
          subtitle="Manage your account details and preferences"
        />

        {/* Profile Header Card */}
        <Card className="p-4 xs:p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Avatar */}
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary font-extrabold text-2xl border-3 border-primary/20">
                {(user.fullName || user.phoneNumber).slice(0, 2).toUpperCase()}
              </div>
              {user.phoneVerified && (
                <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white border-2 border-background">
                  <ShieldCheck className="h-3.5 w-3.5" />
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left space-y-1.5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                  {user.fullName || "Customer"}
                </h2>
                <Badge variant="default" className="text-[10px] py-0.5 px-2 font-bold uppercase w-fit mx-auto sm:mx-0">
                  {user.role}
                </Badge>
                {user.phoneVerified && (
                  <Badge variant="success" className="text-[10px] py-0.5 px-2 font-bold w-fit mx-auto sm:mx-0">
                    Verified
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground font-mono">{user.phoneNumber}</p>
              {user.email && (
                <p className="text-sm text-muted-foreground">{user.email}</p>
              )}
            </div>

            {/* Edit Button */}
            <Button variant="outline" size="sm" className="w-full sm:w-auto rounded-xl gap-1.5 shrink-0">
              <Edit3 className="h-3.5 w-3.5" />
              <span>Edit Profile</span>
            </Button>
          </div>
        </Card>

        {/* Personal Information */}
        <div className="space-y-3">
          <h3 className="text-base font-bold text-foreground px-1">Personal Information</h3>
          <Card className="divide-y divide-border/60">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <UserIcon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Full Name</p>
                  <p className="text-sm font-semibold text-foreground">{user.fullName || "Not set"}</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone Number</p>
                  <p className="text-sm font-semibold text-foreground font-mono">{user.phoneNumber}</p>
                </div>
              </div>
              {user.phoneVerified && (
                <Badge variant="success" className="text-[10px] py-0 px-2">Verified</Badge>
              )}
            </div>

            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-semibold text-foreground">{user.email || "Not set"}</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950">
                  <Globe className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Preferred Language</p>
                  <p className="text-sm font-semibold text-foreground capitalize">{user.preferredLanguage || "English"}</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </Card>
        </div>

        {/* Account */}
        <div className="space-y-3">
          <h3 className="text-base font-bold text-foreground px-1">Account</h3>
          <Card className="divide-y divide-border/60">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Member Since</p>
                  <p className="text-sm font-semibold text-foreground">{memberSince}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Account Status</p>
                  <p className="text-sm font-semibold text-foreground capitalize">{user.status}</p>
                </div>
              </div>
              <Badge
                variant={user.status === "ACTIVE" ? "success" : user.status === "SUSPENDED" ? "destructive" : "warning"}
                className="text-[10px] py-0 px-2 font-bold"
              >
                {user.status}
              </Badge>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h3 className="text-base font-bold text-foreground px-1">Quick Actions</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link href="/customer/jobs" className="block">
              <Card className="p-4 flex items-center gap-3 hover:bg-muted/40 hover:border-primary/40 transition-all cursor-pointer">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground">Manage Addresses</p>
                  <p className="text-xs text-muted-foreground">Add or edit your saved locations</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Card>
            </Link>

            <Card className="p-4 flex items-center gap-3 hover:bg-muted/40 hover:border-primary/40 transition-all cursor-pointer">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950">
                <CreditCard className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">Payment Methods</p>
                <p className="text-xs text-muted-foreground">UPI, cards & wallet settings</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Card>
          </div>
        </div>

        {/* Logout */}
        <div className="pt-2">
          <Button
            variant="outline"
            className="w-full rounded-xl text-destructive hover:text-destructive hover:bg-destructive/5 border-destructive/30"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
    </div>
  );
}
