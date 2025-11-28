export interface GetMonthlySummaryRequest {
  userId: string;
  year: number;
  month: number;
  includeCategories?: boolean;
}

export interface MonthlySummaryData {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  fixedIncome: number;
  dynamicIncome: number;
  fixedExpenses: number;
  dynamicExpenses: number;
  entriesCount: {
    total: number;
    income: number;
    expenses: number;
  };
}

export interface CategoryBreakdownItem {
  categoryId: string;
  categoryName: string;
  type: 'INCOME' | 'EXPENSE';
  total: number;
  count: number;
}

export interface PreviousMonthComparison {
  incomeChange: number;
  expenseChange: number;
  balanceChange: number;
  percentageChanges: {
    income: number;
    expense: number;
    balance: number;
  };
}

export interface CategoryBreakdownResult {
  items: CategoryBreakdownItem[];
  incomeTotal: number;
  expenseTotal: number;
}

export interface GetMonthlySummaryResponse {
  month: string;
  summary: MonthlySummaryData;
  categoryBreakdown?: CategoryBreakdownResult;
  comparisonWithPrevious: PreviousMonthComparison;
}

export interface GetMonthlySummaryUseCase {
  execute(
    request: GetMonthlySummaryRequest,
  ): Promise<GetMonthlySummaryResponse>;
}
