"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/money/format-money";
import { adminApi } from "@/features/admin/api";

import type { ResolveDisputePayload } from "@/features/admin/types";

export default function AdminDisputesPage() {
  const queryClient = useQueryClient();

  const { data: disputes = [], isLoading, error } = useQuery({
    queryKey: ["admin", "disputes"],
    queryFn: () => adminApi.getDisputes(),
  });

  const resolveMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: ResolveDisputePayload;
    }) => adminApi.resolveDispute(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "disputes"] });
    },
  });

  return (
    <Container className="py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-destructive" /> Dispute Resolution Console
        </h1>
        <p className="text-sm text-muted-foreground">
          Mediate customer complaints, incomplete services and payment settlement disputes
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 rounded-xl bg-muted/40 animate-pulse border" />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center text-destructive text-sm flex items-center justify-center gap-2">
          <AlertCircle className="h-4 w-4" /> Failed to load disputes.
        </div>
      ) : disputes.length === 0 ? (
        <div className="py-16 text-center border border-dashed rounded-xl text-muted-foreground space-y-2">
          <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-500" />
          <h3 className="font-semibold text-foreground">Zero Active Disputes</h3>
          <p className="text-xs">There are no unresolved escalations on the platform.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map((d) => (
            <Card key={d.id} className="border-destructive/30">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <Badge variant="outline" className="text-[10px] uppercase font-bold text-destructive border-destructive/30 mb-1">
                      Dispute #{d.id.slice(-6)}
                    </Badge>
                    <CardTitle className="text-base font-bold">{d.jobTitle}</CardTitle>
                  </div>
                  <Badge variant={d.status === "OPEN" ? "destructive" : "secondary"}>
                    {d.status}
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Initiated by {d.initiatorRole} ({d.initiatorName}) vs {d.respondentName}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-muted/40 space-y-1">
                  <span className="font-semibold text-foreground block">Complaint Reason:</span>
                  <p className="text-muted-foreground">{d.reason}</p>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <span className="text-muted-foreground">Disputed Amount in Escrow:</span>
                  <span className="font-bold text-base text-foreground">{formatMoney(d.amount)}</span>
                </div>
              </CardContent>

              {d.status === "OPEN" && (
                <CardFooter className="flex justify-end gap-2 border-t pt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={resolveMutation.isPending}
                    onClick={() =>
                      resolveMutation.mutate({
                        id: d.id,
                        payload: {
                          status: "RESOLVED",
                          summary: "Dispute resolved with full refund issued to customer",
                          refundPaise: Math.round(d.amount * 100),
                          actionTaken: "REFUND_CUSTOMER",
                        },
                      })
                    }
                  >
                    Refund Customer
                  </Button>
                  <Button
                    size="sm"
                    disabled={resolveMutation.isPending}
                    onClick={() =>
                      resolveMutation.mutate({
                        id: d.id,
                        payload: {
                          status: "RESOLVED",
                          summary: "Dispute resolved with payment release to worker",
                          refundPaise: 0,
                          actionTaken: "RELEASE_TO_WORKER",
                        },
                      })
                    }
                  >
                    Release to Worker
                  </Button>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      )}
    </Container>
  );
}
