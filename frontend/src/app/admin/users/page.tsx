"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, UserX, UserCheck, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { adminApi } from "@/features/admin/api";
import type { AdminUser } from "@/features/admin/types";

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ["admin", "users", search, roleFilter],
    queryFn: () => adminApi.getUsers(search, roleFilter),
  });

  const suspendMutation = useMutation({
    mutationFn: () => {
      if (!selectedUser) throw new Error("No user selected");
      const shouldSuspend = selectedUser.status === "ACTIVE";
      return adminApi.setUserSuspension(selectedUser.id, shouldSuspend, "Administrative action");
    },
    onSuccess: () => {
      setSuspendModalOpen(false);
      setSelectedUser(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });

  const handleToggleSuspension = (user: AdminUser) => {
    setSelectedUser(user);
    setSuspendModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">User Management</h1>
        <p className="text-sm text-muted-foreground">
          View, search and manage customer and service provider accounts
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or phone number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
          {["", "CUSTOMER", "WORKER", "ADMIN"].map((r) => (
            <Button
              key={r}
              variant={roleFilter === r ? "default" : "outline"}
              size="sm"
              onClick={() => setRoleFilter(r)}
              className="text-xs shrink-0"
            >
              {r || "All Roles"}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 rounded-lg bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="p-8 text-center text-destructive text-sm flex items-center justify-center gap-2">
              <AlertCircle className="h-4 w-4" /> Failed to load users.
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm">
              No user accounts found matching your filter criteria.
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[600px]">
              <thead className="border-b bg-muted/40 text-xs font-semibold text-muted-foreground uppercase">
                <tr>
                  <th className="p-4">User</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Joined</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-4 font-semibold text-foreground">{u.name}</td>
                    <td className="p-4 font-mono text-xs text-muted-foreground">{u.phone}</td>
                    <td className="p-4">
                      <Badge variant="outline" className="text-[11px] font-semibold">
                        {u.role}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge
                        variant={u.status === "ACTIVE" ? "outline" : "destructive"}
                        className={
                          u.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px]"
                            : "text-[10px]"
                        }
                      >
                        {u.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleSuspension(u)}
                        className={`text-xs ${
                          u.status === "ACTIVE"
                            ? "text-destructive hover:bg-destructive/10"
                            : "text-emerald-600 hover:bg-emerald-50"
                        }`}
                      >
                        {u.status === "ACTIVE" ? (
                          <>
                            <UserX className="mr-1 h-3.5 w-3.5" /> Suspend
                          </>
                        ) : (
                          <>
                            <UserCheck className="mr-1 h-3.5 w-3.5" /> Restore
                          </>
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={suspendModalOpen}
        onOpenChange={setSuspendModalOpen}
        title={selectedUser?.status === "ACTIVE" ? "Suspend User Account?" : "Restore User Account?"}
        description={
          selectedUser?.status === "ACTIVE"
            ? `Are you sure you want to suspend ${selectedUser?.name}? They will not be able to log in or create bookings.`
            : `Are you sure you want to restore access for ${selectedUser?.name}?`
        }
        confirmText={suspendMutation.isPending ? "Processing..." : "Confirm Action"}
        variant={selectedUser?.status === "ACTIVE" ? "destructive" : "default"}
        onConfirm={() => suspendMutation.mutate()}
      />
    </div>
  );
}
