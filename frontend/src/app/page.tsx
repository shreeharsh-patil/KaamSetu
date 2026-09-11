"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Zap,
  Users,
  Briefcase,
  Layers,
  ArrowRight,
  Server,
  Radio,
  CheckCircle2,
  Code2,
  Smartphone,
  Check,
} from "lucide-react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  BottomSheet,
  BottomSheetTrigger,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetDescription,
} from "@/components/ui/bottom-sheet";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { RatingDisplay } from "@/components/shared/rating-display";
import { PriceDisplay } from "@/components/shared/price-display";
import { DistanceDisplay } from "@/components/shared/distance-display";
import { LanguageSelector } from "@/components/shared/language-selector";
import { env } from "@/config/env";
import { siteConfig } from "@/config/site";
import { useAuth } from "@/features/auth/use-auth";

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();

  const [testInput, setTestInput] = useState("");
  const [testSwitch, setTestSwitch] = useState(true);
  const [testCheckbox, setTestCheckbox] = useState(true);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmSuccess, setConfirmSuccess] = useState(false);

  const envMetrics = [
    { key: "API Gateway", val: env.NEXT_PUBLIC_API_URL, icon: Server },
    { key: "WebSocket", val: env.NEXT_PUBLIC_SOCKET_URL, icon: Radio },
    { key: "Map Provider", val: env.NEXT_PUBLIC_MAP_PROVIDER.toUpperCase(), icon: Zap },
    { key: "App URL", val: env.NEXT_PUBLIC_APP_URL, icon: Smartphone },
  ];

  return (
    <div className="py-8 sm:py-12 space-y-12">
      <Container>
        {/* Hero Section */}
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>Phases 0, 1, 2 & 3 Complete</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15]">
            Hyperlocal Skilled-Worker Marketplace
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            {siteConfig.description}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {!isAuthenticated ? (
              <Link href="/login">
                <Button size="lg" leftIcon={<Smartphone className="h-4 w-4" />}>
                  Sign In with Phone OTP
                </Button>
              </Link>
            ) : (
              <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-2 rounded-md text-sm font-semibold">
                <Check className="h-4 w-4 text-emerald-600" />
                <span>Signed in as {user?.role.toUpperCase()} ({user?.phoneNumber})</span>
              </div>
            )}

            <Link href="/customer">
              <Button variant="outline" size="lg" leftIcon={<Users className="h-4 w-4" />}>
                Customer Shell
              </Button>
            </Link>
            <Link href="/worker">
              <Button variant="secondary" size="lg" leftIcon={<Briefcase className="h-4 w-4" />}>
                Worker Shell
              </Button>
            </Link>
          </div>
        </div>
      </Container>

      {/* Phase 1: Design System & UI Foundation Showcase */}
      <Container>
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Phase 1: Design System & Domain Primitives
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Accessible UI primitives built for phone-first skilled trades ergonomics, WCAG AA compliance, and 44px min touch targets.
          </p>
        </div>

        <Tabs defaultValue="forms" className="w-full">
          <TabsList className="grid grid-cols-3 max-w-md mb-6">
            <TabsTrigger value="forms">Form Primitives</TabsTrigger>
            <TabsTrigger value="trades">Trade Primitives</TabsTrigger>
            <TabsTrigger value="overlays">Modals & Overlays</TabsTrigger>
          </TabsList>

          {/* Form Primitives Tab */}
          <TabsContent value="forms" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Input & Selection Controls</CardTitle>
                  <CardDescription>Ergonomic inputs with helper text and error states</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    placeholder="Search skilled electricians..."
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    helperText="Try typing trade keywords like 'Plumber' or 'Wireman'"
                  />

                  <Select defaultValue="mumbai">
                    <option value="mumbai">Mumbai Suburban</option>
                    <option value="pune">Pune Metro</option>
                    <option value="thane">Thane</option>
                    <option value="nashik">Nashik</option>
                  </Select>

                  <Progress value={65} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Toggles & Checkboxes</CardTitle>
                  <CardDescription>Accessible state controls with keyboard focus</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Switch
                    id="worker-available"
                    checked={testSwitch}
                    onCheckedChange={setTestSwitch}
                    label="Active for Immediate Work"
                    description="Broadcast your live location within a 15km radius"
                  />

                  <Checkbox
                    id="verified-only"
                    checked={testCheckbox}
                    onChange={(e) => setTestCheckbox(e.target.checked)}
                    label="Show Aadhaar-Verified Tradespeople Only"
                    description="Filter providers with verified identity and police clearance"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Trade Primitives Tab */}
          <TabsContent value="trades" className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Job Lifecycle Badges</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <StatusBadge status="PUBLISHED" />
                  <StatusBadge status="MATCHED" />
                  <StatusBadge status="IN_PROGRESS" />
                  <StatusBadge status="COMPLETED" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Worker Ratings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <RatingDisplay rating={4.9} totalReviews={142} isVerified />
                  <RatingDisplay rating={4.6} totalReviews={38} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Indian Price Formats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <PriceDisplay amount={450} rateType="hourly" label="Standard Hourly" />
                  <PriceDisplay amount={2200} isEstimate originalAmount={2500} label="AC Servicing" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Distance & Multilingual</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <DistanceDisplay distanceKm={1.8} areaName="Andheri West" />
                  <div className="pt-1">
                    <LanguageSelector />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Overlays Tab */}
          <TabsContent value="overlays" className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-3">
              {/* Dialog test */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Accessible Dialog</CardTitle>
                  <CardDescription>Modal with focus trap, backdrop blur, ESC key dismiss</CardDescription>
                </CardHeader>
                <CardContent>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        Open Service Details Modal
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Emergency Electrical Repair</DialogTitle>
                        <DialogDescription>
                          A certified technician will arrive within 30 minutes. OTP code will be sent to your mobile.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-2 space-y-2">
                        <PriceDisplay amount={350} label="Inspection Fee" />
                        <DistanceDisplay distanceKm={2.1} areaName="Near Station" />
                      </div>
                      <DialogFooter>
                        <Button>Confirm Dispatch</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>

              {/* Mobile Bottom Sheet test */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Mobile Bottom Sheet</CardTitle>
                  <CardDescription>Phone-first slide drawer for trade actions</CardDescription>
                </CardHeader>
                <CardContent>
                  <BottomSheet>
                    <BottomSheetTrigger asChild>
                      <Button variant="secondary" className="w-full">
                        Open Trade Action Drawer
                      </Button>
                    </BottomSheetTrigger>
                    <BottomSheetContent>
                      <BottomSheetHeader>
                        <BottomSheetTitle>Start Job Workflow</BottomSheetTitle>
                        <BottomSheetDescription>
                          Ask customer for the 4-digit start OTP to begin meter clock.
                        </BottomSheetDescription>
                      </BottomSheetHeader>
                      <div className="space-y-4 py-4">
                        <Input placeholder="Enter Customer OTP" maxLength={4} className="text-center font-mono text-xl" />
                        <Button className="w-full">Verify & Start Work</Button>
                      </div>
                    </BottomSheetContent>
                  </BottomSheet>
                </CardContent>
              </Card>

              {/* Confirm Dialog */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Confirmation Alert</CardTitle>
                  <CardDescription>Guard critical destructive trade operations</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => setIsConfirmOpen(true)}
                  >
                    Cancel Service Request
                  </Button>
                  <ConfirmDialog
                    isOpen={isConfirmOpen}
                    onClose={() => setIsConfirmOpen(false)}
                    onConfirm={() => setConfirmSuccess(true)}
                    title="Cancel Service Booking?"
                    description="If you cancel within 10 minutes of arrival, a small cancellation fee may be credited to the worker."
                    variant="destructive"
                    confirmLabel="Yes, Cancel Booking"
                  />
                  {confirmSuccess && (
                    <p className="mt-2 text-xs text-destructive text-center font-medium">
                      Booking cancellation confirmed.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </Container>

      {/* Phase 2: API Client & Server-State Matrix */}
      <Container>
        <Card className="bg-muted/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="h-5 w-5 text-primary" />
                <CardTitle>Phase 2: API Client & Server-State Architecture</CardTitle>
              </div>
              <Badge variant="success">Auto-Refresh & Deduplication</Badge>
            </div>
            <CardDescription>
              Resilient communication with Express backend with transparent 401 token refresh, request ID tracking, and TanStack Query caching.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {envMetrics.map((metric) => {
                const Icon = metric.icon;
                return (
                  <div
                    key={metric.key}
                    className="flex flex-col rounded-md border bg-card p-3 shadow-xs"
                  >
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <Icon className="h-3.5 w-3.5" />
                      <span>{metric.key}</span>
                    </div>
                    <span className="font-mono text-xs font-semibold text-foreground truncate">
                      {metric.val}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </Container>

      {/* Phase 3: Phone OTP Authentication Gateway */}
      <Container>
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Phase 3: Production Phone OTP Authentication
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Passwordless mobile auth tailored for India: +91 auto-formatting, 6-digit OTP with clipboard paste, auto-advance, and role redirects.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="hover:border-primary/40 transition-colors">
            <CardHeader>
              <CardTitle className="text-lg">Step 1: Mobile Number Entry</CardTitle>
              <CardDescription>
                Validates 10-digit Indian numbers starting with 6-9, prevents rate-limit abuse, and initiates SMS OTP dispatch.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/login">
                <Button className="w-full" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Test /login Page
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/40 transition-colors">
            <CardHeader>
              <CardTitle className="text-lg">Step 2: 6-Box OTP Verification</CardTitle>
              <CardDescription>
                Individual boxes with auto-advance, backspace jump, full paste support, 60s countdown timer, and role redirects.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/verify-otp">
                <Button variant="outline" className="w-full" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Test /verify-otp Screen
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </Container>

      {/* Role Shells Navigation */}
      <Container>
        <div className="space-y-4 mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Role Portals & Route Shells
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {siteConfig.roles.map((role) => (
            <Card key={role.id} className="flex flex-col justify-between hover:border-primary/40 transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary">{role.badge}</Badge>
                  <span className="text-xs font-mono text-muted-foreground">{role.path}</span>
                </div>
                <CardTitle>{role.name}</CardTitle>
                <CardDescription>{role.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={role.path} className="w-full">
                  <Button variant="outline" size="sm" className="w-full justify-between" rightIcon={<ArrowRight className="h-4 w-4" />}>
                    Open {role.name}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </div>
  );
}
