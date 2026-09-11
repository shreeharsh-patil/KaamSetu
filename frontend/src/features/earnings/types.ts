export type ExpenseCategory =
  | "TOOLS"
  | "TRAVEL"
  | "MATERIALS"
  | "FOOD"
  | "OTHER";

export type EarningsPeriod = "TODAY" | "WEEK" | "MONTH" | "CUSTOM";

export interface ExpenseItem {
  id: string;
  jobId?: string;
  jobTitle?: string;
  category: ExpenseCategory;
  amount: number;
  note: string;
  receiptUrl?: string;
  createdAt: string;
}

export interface EarningsSummary {
  period: EarningsPeriod;
  grossRevenue: number;
  expenses: number;
  netEarnings: number;
  jobsCompleted: number;
  hoursWorked: number;
  earningsPerHour: number;
  recentTransactions: Array<{
    id: string;
    jobId: string;
    jobTitle: string;
    customerName: string;
    amount: number;
    completedAt: string;
  }>;
}

export interface CreateExpenseInput {
  jobId?: string;
  category: ExpenseCategory;
  amount: number;
  note: string;
  receiptUrl?: string;
}
