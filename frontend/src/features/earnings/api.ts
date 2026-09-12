import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { rupeesToPaise, paiseToRupees } from "@/lib/money/format-money";
import type { EarningsJobItem, EarningsSummary, ExpenseItem, CreateExpenseInput } from "./types";

export const earningsApi = {
  getEarningsSummary: async (period: string = "TODAY"): Promise<EarningsSummary> => {
    const response = await apiClient.get<{
      timeRange: "today" | "week" | "month" | "custom"; grossRevenue: number; totalExpenses: number;
      netEarnings: number; totalJobs: number; hoursWorked: number; earningsPerHour: number;
    }>(`${API_ENDPOINTS.EARNINGS.SUMMARY}?timeRange=${period.toLowerCase()}`);
    return {
      period: period as EarningsSummary["period"],
      grossRevenue: paiseToRupees(response.grossRevenue),
      expenses: paiseToRupees(response.totalExpenses),
      netEarnings: paiseToRupees(response.netEarnings),
      jobsCompleted: response.totalJobs,
      hoursWorked: response.hoursWorked,
      earningsPerHour: paiseToRupees(response.earningsPerHour),
      recentTransactions: [],
    };
  },

  getExpenses: async (): Promise<ExpenseItem[]> => {
    interface ExpenseResponse {
      items?: Array<Record<string, unknown>>;
      expenses?: Array<Record<string, unknown>>;
    }
    const res = await apiClient.get<ExpenseResponse | Array<Record<string, unknown>>>(
      API_ENDPOINTS.EARNINGS.EXPENSES
    );
    let rawItems: Array<Record<string, unknown>> = [];
    if (Array.isArray(res)) {
      rawItems = res;
    } else if (res && Array.isArray(res.items)) {
      rawItems = res.items;
    } else if (res && Array.isArray(res.expenses)) {
      rawItems = res.expenses;
    }
    // Expense amounts arrive as integer paise — normalize to rupees for display.
    return rawItems.map((item) => ({
      id: String(item.id ?? item._id ?? ""),
      jobId: item.jobId ? String(item.jobId) : undefined,
      category: item.category as ExpenseItem["category"],
      amount: paiseToRupees(Number(item.amount ?? 0)),
      note: String(item.note ?? ""),
      receiptUrl:
        item.receipt && typeof item.receipt === "object" && "url" in item.receipt
          ? String((item.receipt as { url?: string }).url ?? "")
          : undefined,
      createdAt: String(item.createdAt ?? new Date().toISOString()),
    }));
  },

  createExpense: async (data: CreateExpenseInput): Promise<ExpenseItem> => {
    // The form collects rupees; the backend requires integer paise.
    const created = await apiClient.post<Record<string, unknown>>(API_ENDPOINTS.EARNINGS.CREATE_EXPENSE, {
      ...data,
      amount: rupeesToPaise(data.amount),
    });
    return {
      id: String(created.id ?? created._id ?? ""),
      jobId: created.jobId ? String(created.jobId) : undefined,
      category: created.category as ExpenseItem["category"],
      amount: paiseToRupees(Number(created.amount ?? 0)),
      note: String(created.note ?? ""),
      createdAt: String(created.createdAt ?? new Date().toISOString()),
    };
  },

  /** Completed jobs with per-job financials (newest first, paginated). */
  getEarningsJobs: async (): Promise<EarningsJobItem[]> => {
    const res = await apiClient.get<{ items?: Array<Record<string, unknown>> } | Array<Record<string, unknown>>>(
      API_ENDPOINTS.EARNINGS.JOBS
    );
    const items = Array.isArray(res) ? res : (res.items ?? []);
    return items.map((item) => ({
      id: String(item.jobId ?? item.id ?? ""),
      jobTitle: String(item.title ?? "Completed job"),
      customerName: item.customerName ? String(item.customerName) : undefined,
      amount: paiseToRupees(Number(item.revenue ?? 0)),
      expenses: paiseToRupees(Number(item.expenses ?? 0)),
      netEarnings: paiseToRupees(Number(item.netEarnings ?? 0)),
      durationHours: Number(item.durationHours ?? 0),
      completedAt: new Date(String(item.completedAt ?? new Date())).toISOString(),
    }));
  },

  deleteExpense: async (id: string): Promise<{ success: boolean }> => {
    return apiClient.delete<{ success: boolean }>(
      API_ENDPOINTS.EARNINGS.DELETE_EXPENSE(id)
    );
  },
};
