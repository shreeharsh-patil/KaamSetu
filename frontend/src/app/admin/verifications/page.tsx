"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, Check, X, FileText, AlertCircle } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { adminApi } from "@/features/admin/api";
import type { AdminVerificationRequest } from "@/features/admin/types";

export default function AdminVerificationsPage() {
  const queryClient = useQueryClient();
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState<AdminVerificationRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data: verifications = [], isLoading, error } = useQuery({
    queryKey: ["admin", "verifications"],
    queryFn: () => adminApi.getVerifications(),
  });

  const reviewMutation = useMutation({
    mutationFn: ({
      id,
      status,
      reason,
    }: {
      id: string;
      status: "APPROVED" | "REJECTED";
      reason?: string;
    }) => adminApi.reviewVerification(id, status, reason),
    onSuccess: () => {
      setRejectModalOpen(false);
      setSelectedReq(null);
      setRejectReason("");
      queryClient.invalidateQueries({ queryKey: ["admin", "verifications"] });
    },
  });

  const handleOpenReject = (req: AdminVerificationRequest) => {
    setSelectedReq(req);
    setRejectReason("Document photo unreadable or incomplete");
    setRejectModalOpen(true);
  };

  return (
    <Container className="py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" /> Worker Verification Pipeline
        </h1>
        <p className="text-sm text-muted-foreground">
          Audit proof of identity, trade skills and experience before granting platform verification badges
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-muted/40 animate-pulse border" />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center text-destructive text-sm flex items-center justify-center gap-2">
          <AlertCircle className="h-4 w-4" /> Failed to load verifications queue.
        </div>
      ) : verifications.length === 0 ? (
        <div className="py-16 text-center border border-dashed rounded-xl text-muted-foreground space-y-2">
          <ShieldCheck className="h-10 w-10 mx-auto text-muted-foreground/40" />
          <h3 className="font-semibold text-foreground">No Pending Verifications</h3>
          <p className="text-xs">All submitted worker applications have been processed.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {verifications.map((req) => (
            <Card key={req.id} className="border">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg font-bold">{req.workerName}</CardTitle>
                    <CardDescription className="text-xs">
                      Category: <span className="font-semibold uppercase">{req.category}</span> •{" "}
                      {req.experienceYears} Years Experience
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-[10px]">
                    {req.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 text-xs">
                <div>
                  <span className="text-muted-foreground block mb-1">Declared Trade Skills:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {req.skills.map((s, i) => (
                      <Badge key={i} variant="secondary" className="text-[11px]">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-3">
                  <span className="text-muted-foreground block mb-2">Submitted Proof Documents:</span>
                  <div className="flex flex-wrap gap-2">
                    {req.documents.map((doc, i) => (
                      <a
                        key={i}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 p-2 rounded-lg border bg-muted/40 hover:bg-muted text-foreground transition-colors"
                      >
                        <FileText className="h-3.5 w-3.5 text-primary" />
                        <span className="font-medium">{doc.type}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex justify-end gap-2 pt-0 border-t mt-3 py-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenReject(req)}
                  disabled={reviewMutation.isPending}
                  className="text-destructive hover:bg-destructive/10"
                >
                  <X className="mr-1 h-3.5 w-3.5" /> Reject with Reason
                </Button>
                <Button
                  size="sm"
                  onClick={() =>
                    reviewMutation.mutate({ id: req.id, status: "APPROVED" })
                  }
                  disabled={reviewMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Check className="mr-1 h-3.5 w-3.5" /> Approve & Verify
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Reject Reason Dialog */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Verification Application</DialogTitle>
            <DialogDescription>
              Provide an explanatory reason so the worker knows what documents to re-upload.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <label className="text-xs font-medium text-foreground">Rejection Reason *</label>
            <Input
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Aadhaar card photo is blurry; please re-upload clear copy."
            />
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!rejectReason.trim() || reviewMutation.isPending}
              onClick={() => {
                if (selectedReq) {
                  reviewMutation.mutate({
                    id: selectedReq.id,
                    status: "REJECTED",
                    reason: rejectReason,
                  });
                }
              }}
            >
              {reviewMutation.isPending ? "Processing..." : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Container>
  );
}
