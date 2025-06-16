import { EntryModel } from '@domain/models/entry.model';
import { AddEntryRequest } from '@domain/usecases/add-entry.usecase';

export const mockEntry: EntryModel = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  userId: 'user-123',
  description: 'Test Entry',
  amount: 10000, // 100.00 in cents
  categoryId: 'category-123',
  type: 'EXPENSE',
  isFixed: false,
  date: new Date('2025-06-01'),
  createdAt: new Date('2025-06-01T10:00:00Z'),
  updatedAt: new Date('2025-06-01T10:00:00Z'),
  deletedAt: null,
};

export const mockAddEntryRequest: AddEntryRequest = {
  userId: 'user-123',
  description: 'Test Entry',
  amount: 10000,
  categoryId: 'category-123',
  type: 'EXPENSE',
  isFixed: false,
  date: new Date('2025-06-01'),
};

/**
 * Factory for creating Entry mock instances with variations
 */
export class MockEntryFactory {
  static create(overrides: Partial<EntryModel> = {}): EntryModel {
    return { ...mockEntry, ...overrides };
  }

  static createMany(
    count: number,
    overrides: Partial<EntryModel> = {},
  ): EntryModel[] {
    return Array.from({ length: count }, (_, index) =>
      this.create({
        ...overrides,
        id: `entry-${index + 1}`,
        description: `Test Entry ${index + 1}`,
      }),
    );
  }

  static createValid(): EntryModel {
    return this.create();
  }

  static createInvalid(): Partial<EntryModel> {
    return {
      ...mockEntry,
      id: undefined,
      amount: -100, // Invalid negative amount
      description: '', // Invalid empty description
    };
  }

  static createAddRequest(
    overrides: Partial<AddEntryRequest> = {},
  ): AddEntryRequest {
    return { ...mockAddEntryRequest, ...overrides };
  }

  static createIncome(amount: number = 50000): EntryModel {
    return this.create({
      type: 'INCOME',
      amount,
      categoryId: 'salary-category',
      description: 'Monthly Salary',
    });
  }

  static createExpense(amount: number = 10000): EntryModel {
    return this.create({
      type: 'EXPENSE',
      amount,
      categoryId: 'food-category',
      description: 'Grocery Shopping',
    });
  }

  static createFixed(isFixed: boolean = true): EntryModel {
    return this.create({
      isFixed,
      description: isFixed ? 'Fixed Monthly Rent' : 'Variable Expense',
      categoryId: isFixed ? 'housing-category' : 'variable-category',
    });
  }

  static createForUser(userId: string): EntryModel {
    return this.create({ userId });
  }

  static createForDateRange(startDate: Date, endDate: Date): EntryModel[] {
    const entries: EntryModel[] = [];
    const currentDate = new Date(startDate);
    let index = 1;

    while (currentDate <= endDate) {
      entries.push(
        this.create({
          id: `entry-${index}`,
          date: new Date(currentDate),
          description: `Entry for ${currentDate.toISOString().split('T')[0]}`,
        }),
      );

      currentDate.setDate(currentDate.getDate() + 1);
      index++;
    }

    return entries;
  }

  static createInvalidRequest(): Partial<AddEntryRequest> {
    return {
      userId: '',
      description: '',
      amount: -100,
      categoryId: '',
      type: 'EXPENSE',
      isFixed: false,
      date: new Date(),
    };
  }
}
