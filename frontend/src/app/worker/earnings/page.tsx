"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  IndianRupee,
  Receipt,
  PlusCircle,
  Briefcase,
  Trash2,
  Loader2,
} from "lucide-react";
import { Container } from "@/components/layout/container";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { formatMoney } from "@/lib/money/format-money";
import { earningsApi } from "@/features/earnings/api";
import type { EarningsPeriod, ExpenseCategory } from "@/features/earnings/types";

export default function WorkerEarningsPage() {
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState<EarningsPeriod>("TODAY");
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);

  const [expenseForm, setExpenseForm] = useState({
    amount: "",
    category: "MATERIAL" as ExpenseCategory,
    note: "",
    jobId: "",
  });

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["worker", "earnings", "summary", period],
    queryFn: () => earningsApi.getEarningsSummary(period),
  });

  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ["worker", "expenses"],
    queryFn: () => earningsApi.getExpenses(),
  });

  const { data: earningsJobs = [] } = useQuery({
    queryKey: ["worker", "earnings", "jobs"],
    queryFn: () => earningsApi.getEarningsJobs(),
  });

  const createExpenseMutation = useMutation({
    mutationFn: () =>
      earningsApi.createExpense({
        amount: parseFloat(expenseForm.amount) || 0,
        category: expenseForm.category,
        note: expenseForm.note,
        jobId: expenseForm.jobId || undefined,
      }),
    onSuccess: () => {
      setExpenseModalOpen(false);
      setExpenseForm({ amount: "", category: "MATERIAL", note: "", jobId: "" });
      queryClient.invalidateQueries({ queryKey: ["worker", "expenses"] });
      queryClient.invalidateQueries({ queryKey: ["worker", "earnings"] });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id: string) => earningsApi.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["worker", "expenses"] });
      queryClient.invalidateQueries({ queryKey: ["worker", "earnings"] });
    },
  });

  const gross = summary?.grossRevenue ?? 0;
  const totalExp = summary?.expenses ?? 0;
  const net = summary?.netEarnings ?? (gross - totalExp);

  return (
    <Container className="py-6 space-y-6">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <IndianRupee className="h-6 w-6 text-primary" />
            Earnings & Expenses Ledger
          </h1>
          <p className="text-sm text-muted-foreground">
            Track gross revenue, material costs, and real take-home net profit
          </p>
        </div>
        <Button onClick={() => setExpenseModalOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Record New Expense
        </Button>
      </div>

      {/* Period Tabs */}
      <Tabs
        value={period}
        onValueChange={(val) => setPeriod(val as EarningsPeriod)}
        className="w-full"
      >
        <TabsList className="grid grid-cols-4 w-full sm:w-[400px]">
          <TabsTrigger value="TODAY">Today</TabsTrigger>
          <TabsTrigger value="WEEK">This Week</TabsTrigger>
          <TabsTrigger value="MONTH">This Month</TabsTrigger>
          <TabsTrigger value="CUSTOM">All Time</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardHeader className="pb-2">
            <CardDescription className="text-emerald-700 dark:text-emerald-400 font-semibold text-xs">
              Net Take-Home Earnings
            </CardDescription>
            <CardTitle className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {summaryLoading ? "..." : formatMoney(net)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            True profit after deducting logged expenses
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Gross Customer Inflow</CardDescription>
            <CardTitle className="text-2xl font-bold text-foreground">
              {summaryLoading ? "..." : formatMoney(gross)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            {summary?.jobsCompleted ?? 0} jobs completed • {summary?.hoursWorked ?? 0} hrs worked
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Material & Travel Expenses</CardDescription>
            <CardTitle className="text-2xl font-bold text-destructive">
              {summaryLoading ? "..." : formatMoney(totalExp)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            {expenses.length} expense entries recorded
          </CardContent>
        </Card>
      </div>

      {/* Two columns: Recent Completed Jobs & Logged Expenses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Completed Jobs Column */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" /> Completed Jobs Inflow
            </CardTitle>
            <CardDescription className="text-xs">Direct customer payouts credited</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {earningsJobs.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">
                No completed jobs recorded yet.
              </p>
            ) : (
              earningsJobs.slice(0, 8).map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/20"
                >
                  <div>
                    <h4 className="font-semibold text-xs text-foreground">{tx.jobTitle}</h4>
                    <p className="text-[11px] text-muted-foreground">
                      {tx.durationHours.toFixed(1)} hrs on site
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-sm text-emerald-600">
                      +{formatMoney(tx.amount)}
                    </span>
                    <span className="block text-[10px] text-muted-foreground">
                      {new Date(tx.completedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Expenses Ledger Column */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="h-4 w-4 text-destructive" /> Out-of-Pocket Expenses
              </CardTitle>
              <CardDescription className="text-xs">Deducted from gross calculations</CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={() => setExpenseModalOpen(true)}>
              + Add
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {expensesLoading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="h-14 rounded-lg bg-muted/40 animate-pulse" />
                ))}
              </div>
            ) : expenses.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">
                No expenses logged yet. Tap &ldquo;Add&rdquo; to record tool or material purchases.
              </p>
            ) : (
              expenses.map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/20"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-foreground">{exp.note || exp.category}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted font-medium text-muted-foreground uppercase">
                        {exp.category}
                      </span>
                    </div>
                    {exp.jobTitle && (
                      <p className="text-[11px] text-muted-foreground">For: {exp.jobTitle}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-destructive">
                      -{formatMoney(exp.amount)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      disabled={deleteExpenseMutation.isPending}
                      onClick={() => deleteExpenseMutation.mutate(exp.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Log Expense Dialog */}
      <Dialog open={expenseModalOpen} onOpenChange={setExpenseModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Work Expense</DialogTitle>
            <DialogDescription>
              Log tool purchases, spare parts, travel or material costs for accurate net calculations.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Amount (₹) *</label>
              <Input
                type="number"
                placeholder="e.g. 450"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm((p) => ({ ...p, amount: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Expense Category *</label>
              <Select
                value={expenseForm.category}
                onChange={(e) =>
                  setExpenseForm((p) => ({
                    ...p,
                    category: e.target.value as ExpenseCategory,
                  }))
                }
              >
                <option value="MATERIAL">Materials & Spare Parts</option>
                <option value="TOOL">Tools & Equipment</option>
                <option value="FUEL">Travel / Petrol</option>
                <option value="PARKING">Parking / Tolls</option>
                <option value="PLATFORM_FEE">Platform Fee</option>
                <option value="OTHER">Other Expense</option>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Expense Note / Item Name *</label>
              <Input
                placeholder="e.g. 2x Brass valve 1/2 inch"
                value={expenseForm.note}
                onChange={(e) => setExpenseForm((p) => ({ ...p, note: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setExpenseModalOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!expenseForm.amount || !expenseForm.note || createExpenseMutation.isPending}
              onClick={() => createExpenseMutation.mutate()}
            >
              {createExpenseMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                "Save Expense"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Container>
  );
}
