"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserX, UserCheck, Eye, AlertCircle } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { adminApi } from "@/features/admin/api";
import type { AdminWorker } from "@/features/admin/types";

export default function AdminWorkersPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("");
  const [selectedWorker, setSelectedWorker] = useState<AdminWorker | null>(null);
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);

  const { data: workers = [], isLoading, error } = useQuery({
    queryKey: ["admin", "workers", filter],
    queryFn: () => adminApi.getWorkers(filter),
  });

  const suspendMutation = useMutation({
    mutationFn: () => {
      if (!selectedWorker) throw new Error("No worker selected");
      return adminApi.setUserSuspension(
        selectedWorker.userId,
        !selectedWorker.isSuspended,
        "Admin worker suspension action"
      );
    },
    onSuccess: () => {
      setSuspendModalOpen(false);
      setSelectedWorker(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "workers"] });
    },
  });

  return (
    <Container className="py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Worker Fleet Management</h1>
          <p className="text-sm text-muted-foreground">
            Monitor registered tradespeople, skills and verification status
          </p>
        </div>
        <div className="flex gap-2">
          {["", "APPROVED", "PENDING", "REJECTED"].map((s) => (
            <Button
              key={s}
              variant={filter === s ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(s)}
              className="text-xs"
            >
              {s || "All"}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="p-8 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 rounded-lg bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="p-8 text-center text-destructive text-sm flex items-center justify-center gap-2">
              <AlertCircle className="h-4 w-4" /> Failed to load workers.
            </div>
          ) : workers.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm">
              No workers found under this filter.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/40 text-xs font-semibold text-muted-foreground uppercase">
                <tr>
                  <th className="p-4">Professional</th>
                  <th className="p-4">Trade</th>
                  <th className="p-4">Locality</th>
                  <th className="p-4">Verification</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {workers.map((w) => (
                  <tr key={w.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-foreground">{w.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{w.phone}</div>
                    </td>
                    <td className="p-4">
                      <span className="font-medium capitalize text-xs">{w.category}</span>
                      <div className="text-[11px] text-muted-foreground">
                        {w.skills?.slice(0, 2).join(", ")}
                      </div>
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">{w.locality}</td>
                    <td className="p-4">
                      <Badge
                        variant="outline"
                        className={
                          w.verificationStatus === "VERIFIED" || w.verificationStatus === "APPROVED"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px]"
                            : w.verificationStatus === "PENDING"
                            ? "bg-amber-50 text-amber-700 border-amber-300 text-[10px]"
                            : "bg-red-50 text-red-700 border-red-300 text-[10px]"
                        }
                      >
                        {w.verificationStatus}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge
                        variant={w.isSuspended ? "destructive" : "secondary"}
                        className="text-[10px]"
                      >
                        {w.isSuspended ? "SUSPENDED" : "ACTIVE"}
                      </Badge>
                    </td>
                    <td className="p-4 text-right space-x-1">
                      <Button asChild variant="ghost" size="sm" className="h-8">
                        <Link href={`/workers/${w.id}`}>
                          <Eye className="h-3.5 w-3.5 mr-1" /> Profile
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedWorker(w);
                          setSuspendModalOpen(true);
                        }}
                        className={`h-8 text-xs ${
                          w.isSuspended ? "text-emerald-600" : "text-destructive"
                        }`}
                      >
                        {w.isSuspended ? (
                          <>
                            <UserCheck className="h-3.5 w-3.5 mr-1" /> Restore
                          </>
                        ) : (
                          <>
                            <UserX className="h-3.5 w-3.5 mr-1" /> Suspend
                          </>
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={suspendModalOpen}
        onOpenChange={setSuspendModalOpen}
        title={selectedWorker?.isSuspended ? "Restore Worker?" : "Suspend Worker Account?"}
        description={`Are you sure you want to update status for ${selectedWorker?.name}?`}
        confirmText={suspendMutation.isPending ? "Updating..." : "Confirm"}
        variant={selectedWorker?.isSuspended ? "default" : "destructive"}
        onConfirm={() => suspendMutation.mutate()}
      />
    </Container>
  );
}
