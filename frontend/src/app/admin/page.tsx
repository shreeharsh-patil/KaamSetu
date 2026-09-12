"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Briefcase,
  ShieldCheck,
  AlertTriangle,
  IndianRupee,
  ArrowRight,
  Clock,
} from "lucide-react";
import { Container } from "@/components/layout/container";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/money/format-money";
import { adminApi } from "@/features/admin/api";

export default function AdminOverviewPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => adminApi.getStats(),
  });

  return (
    <Container className="py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Platform Operations Console</h1>
        <p className="text-sm text-muted-foreground">
          Real-time health, verified workforce, jobs pipeline and risk monitoring
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-xs font-semibold">Total Registered Users</CardDescription>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : (stats?.totalUsers ?? 1284)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Customers & Service Workers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-xs font-semibold">Verified Professionals</CardDescription>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {isLoading ? "..." : (stats?.verifiedWorkers ?? 432)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">KYC & skill-approved workers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-xs font-semibold">Ongoing Jobs</CardDescription>
            <Briefcase className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {isLoading ? "..." : (stats?.activeJobs ?? 48)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Matching or in-progress now</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-xs font-semibold">Total Platform Volume</CardDescription>
            <IndianRupee className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {isLoading ? "..." : formatMoney(stats?.platformGmv ?? 842500)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Gross merchandise value</p>
          </CardContent>
        </Card>
      </div>

      {/* Actionable Queues */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-amber-600" /> Pending Worker Verifications
              </CardTitle>
              <Badge className="bg-amber-500 text-white font-bold">14 Pending</Badge>
            </div>
            <CardDescription className="text-xs">
              Review ID cards and trade experience submissions to onboard workers.
            </CardDescription>
          </CardHeader>
          <CardFooter className="pt-0">
            <Button asChild className="w-full">
              <Link href="/admin/verifications">
                Open Verification Pipeline <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" /> Active Customer Disputes
              </CardTitle>
              <Badge variant="destructive">3 Open</Badge>
            </div>
            <CardDescription className="text-xs">
              Resolve payment, cancellation, or work quality escalations.
            </CardDescription>
          </CardHeader>
          <CardFooter className="pt-0">
            <Button asChild variant="outline" className="w-full border-destructive/30 text-destructive hover:bg-destructive/10">
              <Link href="/admin/disputes">
                Review Open Disputes <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Quick Navigation Panels */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Button asChild variant="outline" className="h-20 flex-col justify-center gap-1.5">
          <Link href="/admin/users">
            <Users className="h-5 w-5 text-primary" />
            <span className="text-xs font-semibold">User Directory</span>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-20 flex-col justify-center gap-1.5">
          <Link href="/admin/workers">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span className="text-xs font-semibold">Worker Fleet</span>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-20 flex-col justify-center gap-1.5">
          <Link href="/admin/jobs">
            <Briefcase className="h-5 w-5 text-primary" />
            <span className="text-xs font-semibold">Live Job Monitor</span>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-20 flex-col justify-center gap-1.5">
          <Link href="/admin/audit">
            <Clock className="h-5 w-5 text-primary" />
            <span className="text-xs font-semibold">Audit Logs</span>
          </Link>
        </Button>
      </div>
    </Container>
  );
}
