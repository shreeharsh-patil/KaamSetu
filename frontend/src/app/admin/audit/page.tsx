"use client";

import { useQuery } from "@tanstack/react-query";
import { Clock, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { adminApi } from "@/features/admin/api";

export default function AdminAuditLogsPage() {
  const { data: logs = [], isLoading, error } = useQuery({
    queryKey: ["admin", "audit-logs"],
    queryFn: () => adminApi.getAuditLogs(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Clock className="h-6 w-6 text-primary" /> Administrative Audit Trail
        </h1>
        <p className="text-sm text-muted-foreground">
          Immutable, timestamped record of administrative actions, suspensions and dispute resolutions
        </p>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="p-8 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 rounded-lg bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="p-8 text-center text-destructive text-sm flex items-center justify-center gap-2">
              <AlertCircle className="h-4 w-4" /> Failed to load audit logs.
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm">
              No audit log entries recorded yet.
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[600px]">
              <thead className="border-b bg-muted/40 text-xs font-semibold text-muted-foreground uppercase">
                <tr>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Admin</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Target Entity</th>
                  <th className="p-4">Reason / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y text-xs">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/20">
                    <td className="p-4 text-muted-foreground font-mono">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-4 font-medium text-foreground">{log.adminEmail}</td>
                    <td className="p-4">
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {log.action}
                      </Badge>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {log.targetEntity}: <span className="font-mono">{log.targetId.slice(-8)}</span>
                    </td>
                    <td className="p-4 text-muted-foreground">{log.reason || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
