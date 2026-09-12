import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { EarningsSummary, ExpenseItem, CreateExpenseInput } from "./types";

export const earningsApi = {
  getEarningsSummary: async (period: string = "TODAY"): Promise<EarningsSummary> => {
    const response = await apiClient.get<{
      timeRange: "today" | "week" | "month" | "custom"; grossRevenue: number; totalExpenses: number;
      netEarnings: number; totalJobs: number; hoursWorked: number; earningsPerHour: number;
    }>(`${API_ENDPOINTS.EARNINGS.SUMMARY}?timeRange=${period.toLowerCase()}`);
    return {
      period: period as EarningsSummary["period"],
      grossRevenue: response.grossRevenue / 100,
      expenses: response.totalExpenses / 100,
      netEarnings: response.netEarnings / 100,
      jobsCompleted: response.totalJobs,
      hoursWorked: response.hoursWorked,
      earningsPerHour: response.earningsPerHour / 100,
      recentTransactions: [],
    };
  },

  getExpenses: async (): Promise<ExpenseItem[]> => {
    const res = await apiClient.get<{ expenses: ExpenseItem[] } | ExpenseItem[]>(
      API_ENDPOINTS.EARNINGS.EXPENSES
    );
    if (Array.isArray(res)) return res;
    return res.expenses ?? [];
  },

  createExpense: async (data: CreateExpenseInput): Promise<ExpenseItem> => {
    return apiClient.post<ExpenseItem>(API_ENDPOINTS.EARNINGS.CREATE_EXPENSE, data);
  },

  deleteExpense: async (id: string): Promise<{ success: boolean }> => {
    return apiClient.delete<{ success: boolean }>(
      API_ENDPOINTS.EARNINGS.DELETE_EXPENSE(id)
    );
  },
};
