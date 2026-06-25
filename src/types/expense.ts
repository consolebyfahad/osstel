export interface Expense {
  id: string;
  hostelId: string;
  hostelName?: string | null;
  title: string;
  details: string;
  amount: number;
  image: string | null;
  month: number;
  year: number;
  expenseDate: string;
  createdAt: string;
}

export type CreateExpenseBody = {
  hostelId: string;
  title: string;
  details?: string;
  amount: number;
  image?: string;
  month?: number;
  year?: number;
};

export type GetExpensesParams = {
  hostelId: string;
  month?: number;
  year?: number;
};

export type GetExpenseSummaryParams = {
  hostelId?: string;
  hostelIds?: string;
  month?: number;
  year?: number;
};

export interface ExpensesResponse {
  month: number;
  year: number;
  hostel: {
    id: string;
    name: string;
  };
  summary: {
    totalAmount: number;
    count: number;
  };
  expenses: Expense[];
}

export interface ExpenseSummaryResponse {
  month: number;
  year: number;
  totals: Array<{
    hostelId: string;
    hostelName: string;
    totalAmount: number;
    count: number;
  }>;
  summary: {
    totalAmount: number;
    count: number;
  };
}

export interface CreateExpenseResponse {
  message: string;
  expense: Expense;
}
