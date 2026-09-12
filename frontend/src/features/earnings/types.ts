export type ExpenseCategory =
  | "FUEL"
  | "MATERIAL"
  | "PARKING"
  | "TOOL"
  | "PLATFORM_FEE"
  | "OTHER";

export type EarningsPeriod = "TODAY" | "WEEK" | "MONTH" | "CUSTOM";

export interface ExpenseItem {
  id: string;
  jobId?: string;
  jobTitle?: string;
  category: ExpenseCategory;
  /** Rupees — the API layer converts from the backend's integer paise. */
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
  recentTransactions: EarningsJobItem[];
}

/** One completed job's financials (rupees, converted from backend paise). */
export interface EarningsJobItem {
  id: string;
  jobTitle: string;
  customerName?: string;
  amount: number;
  expenses: number;
  netEarnings: number;
  durationHours: number;
  completedAt: string;
}

export interface CreateExpenseInput {
  jobId?: string;
  category: ExpenseCategory;
  /** Rupees — converted to paise at the API boundary. */
  amount: number;
  note: string;
  receiptUrl?: string;
}
