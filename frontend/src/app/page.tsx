import Link from "next/link";
import {
  ShieldCheck,
  Zap,
  Users,
  Briefcase,
  Layers,
  ArrowRight,
  Server,
  Globe,
  Radio,
  CheckCircle2,
  Code2,
} from "lucide-react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { env } from "@/config/env";
import { siteConfig } from "@/config/site";

export default function HomePage() {
  const envMetrics = [
    { key: "API Gateway", val: env.NEXT_PUBLIC_API_URL, icon: Server },
    { key: "WebSocket", val: env.NEXT_PUBLIC_SOCKET_URL, icon: Radio },
    { key: "Map Provider", val: env.NEXT_PUBLIC_MAP_PROVIDER.toUpperCase(), icon: Globe },
    { key: "App URL", val: env.NEXT_PUBLIC_APP_URL, icon: Zap },
  ];

  return (
    <div className="py-8 sm:py-12 space-y-12">
      <Container>
        {/* Hero Section */}
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>Phase 0: Frontend Foundation Verified</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15]">
            Hyperlocal Skilled-Worker Marketplace
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            {siteConfig.description}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link href="/customer">
              <Button leftIcon={<Users className="h-4 w-4" />}>
                Customer Shell
              </Button>
            </Link>
            <Link href="/worker">
              <Button variant="secondary" leftIcon={<Briefcase className="h-4 w-4" />}>
                Worker Shell
              </Button>
            </Link>
            <Link href="/admin">
              <Button variant="outline" leftIcon={<ShieldCheck className="h-4 w-4" />}>
                Admin Console
              </Button>
            </Link>
          </div>
        </div>
      </Container>

      {/* Role Shells Preview */}
      <Container>
        <div className="space-y-4 mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Role-Aware Route Architecture
          </h2>
          <p className="text-sm text-muted-foreground">
            Modular route groups ready for upcoming Phase implementations with zero client-side logic leakage.
          </p>
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

      {/* Configuration & Environment Matrix */}
      <Container>
        <Card className="bg-muted/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="h-5 w-5 text-primary" />
                <CardTitle>Environment & Runtime Validation</CardTitle>
              </div>
              <Badge variant="success">Validated via Zod</Badge>
            </div>
            <CardDescription>
              All client-facing variables are strictly parsed, validated, and type-safe.
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

      {/* UI Primitives & Design System Verification */}
      <Container>
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Design System Foundation Tokens
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Tailwind CSS tokens, semantic color variants, 44px min touch ergonomically optimized for trade workers on mobile.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Buttons showcase */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Button Variants (44px Touch Targets)</CardTitle>
              <CardDescription>Accessible tap targets for outdoor and mobile use</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button variant="default">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="accent">Accent</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="default" isLoading>Loading</Button>
            </CardContent>
          </Card>

          {/* Feedback & Status triggers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Global Error & Boundary Handlers</CardTitle>
              <CardDescription>Resilient fallbacks for offline, missing, and unauthorized routes</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Link href="/non-existent-route-for-testing-404">
                <Button variant="outline" size="sm">Test 404 Handler</Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="sm">Auth Shell Preview</Button>
              </Link>
              <Link href="/unauthorized">
                <Button variant="outline" size="sm">Unauthorized Screen</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </Container>
    </div>
  );
}
