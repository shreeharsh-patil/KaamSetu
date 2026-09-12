import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { EarningsSummary, ExpenseItem, CreateExpenseInput } from "./types";

export const earningsApi = {
  getEarningsSummary: async (period: string = "TODAY"): Promise<EarningsSummary> => {
    return apiClient.get<EarningsSummary>(
      `${API_ENDPOINTS.EARNINGS.SUMMARY}?period=${period}`
    );
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
