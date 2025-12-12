import { ApiProperty } from '@nestjs/swagger';

export class MonthlySummaryDataDto {
  @ApiProperty({
    description: 'Total income amount for the month',
    example: 6800.0,
  })
  totalIncome: number;

  @ApiProperty({
    description: 'Total paid expenses amount for the month',
    example: 4200.0,
  })
  totalExpenses: number;

  @ApiProperty({
    description: 'Total paid expenses amount for the month',
    example: 4200.0,
  })
  totalPaidExpenses: number;

  @ApiProperty({
    description: 'Total unpaid expenses amount for the month',
    example: 800.0,
  })
  totalUnpaidExpenses: number;

  @ApiProperty({
    description: 'Balance (income - paid expenses) for the month',
    example: 2600.0,
  })
  balance: number;

  @ApiProperty({
    description: 'Total fixed income for the month',
    example: 5000.0,
  })
  fixedIncome: number;

  @ApiProperty({
    description: 'Total dynamic income for the month',
    example: 1800.0,
  })
  dynamicIncome: number;

  @ApiProperty({
    description: 'Total paid fixed expenses for the month',
    example: 2500.0,
  })
  fixedExpenses: number;

  @ApiProperty({
    description: 'Total paid dynamic expenses for the month',
    example: 1700.0,
  })
  dynamicExpenses: number;

  @ApiProperty({
    description: 'Total paid fixed expenses for the month',
    example: 2500.0,
  })
  fixedPaidExpenses: number;

  @ApiProperty({
    description: 'Total unpaid fixed expenses for the month',
    example: 300.0,
  })
  fixedUnpaidExpenses: number;

  @ApiProperty({
    description: 'Total paid dynamic expenses for the month',
    example: 1700.0,
  })
  dynamicPaidExpenses: number;

  @ApiProperty({
    description: 'Total unpaid dynamic expenses for the month',
    example: 500.0,
  })
  dynamicUnpaidExpenses: number;

  @ApiProperty({
    description: 'Entries count breakdown',
    type: 'object',
    properties: {
      total: { type: 'number', example: 28 },
      income: { type: 'number', example: 12 },
      expenses: { type: 'number', example: 16 },
    },
  })
  entriesCount: {
    total: number;
    income: number;
    expenses: number;
  };
}

export class CategoryBreakdownItemDto {
  @ApiProperty({
    description: 'Category ID',
    example: 'uuid-category-id',
  })
  categoryId: string;

  @ApiProperty({
    description: 'Category name',
    example: 'Salary',
  })
  categoryName: string;

  @ApiProperty({
    description: 'Category type',
    enum: ['INCOME', 'EXPENSE'],
    example: 'INCOME',
  })
  type: 'INCOME' | 'EXPENSE';

  @ApiProperty({
    description:
      'Total paid amount for this category (for expenses, only paid)',
    example: 5000.0,
  })
  total: number;

  @ApiProperty({
    description: 'Number of entries in this category',
    example: 1,
  })
  count: number;

  @ApiProperty({
    description: 'Unpaid amount for this category (only for expenses)',
    example: 500.0,
  })
  unpaidAmount: number;
}

export class PreviousMonthComparisonDto {
  @ApiProperty({
    description: 'Income change from previous month',
    example: 200.0,
  })
  incomeChange: number;

  @ApiProperty({
    description: 'Expense change from previous month',
    example: -150.0,
  })
  expenseChange: number;

  @ApiProperty({
    description: 'Balance change from previous month',
    example: 350.0,
  })
  balanceChange: number;

  @ApiProperty({
    description: 'Percentage changes from previous month',
    type: 'object',
    properties: {
      income: { type: 'number', example: 3.03 },
      expense: { type: 'number', example: -3.45 },
      balance: { type: 'number', example: 15.56 },
    },
  })
  percentageChanges: {
    income: number;
    expense: number;
    balance: number;
  };
}

export class CategoryBreakdownResultDto {
  @ApiProperty({
    description: 'Top 3 category items with highest values',
    type: [CategoryBreakdownItemDto],
  })
  items: CategoryBreakdownItemDto[];

  @ApiProperty({
    description: 'Total number of income category items',
    example: 5,
  })
  incomeTotal: number;

  @ApiProperty({
    description: 'Total number of expense category items',
    example: 8,
  })
  expenseTotal: number;
}

export class MonthlySummaryResponseDto {
  @ApiProperty({
    description: 'Month in YYYY-MM format',
    example: '2024-01',
  })
  month: string;

  @ApiProperty({
    description: 'Monthly summary data',
    type: MonthlySummaryDataDto,
  })
  summary: MonthlySummaryDataDto;

  @ApiProperty({
    description: 'Category breakdown (optional)',
    type: CategoryBreakdownResultDto,
    required: false,
  })
  categoryBreakdown?: CategoryBreakdownResultDto;

  @ApiProperty({
    description: 'Comparison with previous month',
    type: PreviousMonthComparisonDto,
  })
  comparisonWithPrevious: PreviousMonthComparisonDto;
}
