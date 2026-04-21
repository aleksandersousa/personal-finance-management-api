import { EntryModel } from '@domain/models/entry.model';
import { AddEntryRequest } from '@domain/usecases/add-entry.usecase';
import { UpdateEntryRequest } from '@domain/usecases/update-entry.usecase';

export const mockEntry: EntryModel = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  recurrenceId: null,
  userId: 'user-123',
  description: 'Test Entry',
  amount: 10000, // 100.00 in cents
  categoryId: 'category-123',
  issueDate: new Date('2025-06-01'),
  dueDate: new Date('2025-06-01'),
  category: {
    id: 'category-123',
    name: 'Food',
    type: 'EXPENSE' as any,
    createdAt: new Date('2025-06-01T10:00:00Z'),
    updatedAt: new Date('2025-06-01T10:00:00Z'),
  },
  createdAt: new Date('2025-06-01T10:00:00Z'),
  updatedAt: new Date('2025-06-01T10:00:00Z'),
};

export const mockAddEntryRequest: AddEntryRequest = {
  userId: 'user-123',
  description: 'Test Entry',
  amount: 10000,
  categoryId: 'category-123',
  issueDate: new Date('2025-06-01'),
  dueDate: new Date('2025-06-01'),
};

export const mockUpdateEntryRequest: UpdateEntryRequest = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  userId: 'user-123',
  description: 'Updated Test Entry',
  amount: 15000, // 150.00 in cents
  categoryId: 'category-123',
  issueDate: new Date('2025-06-15'),
  dueDate: new Date('2025-06-15'),
  recurrenceId: 'recurrence-1',
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

  static createUpdateRequest(
    overrides: Partial<UpdateEntryRequest> = {},
  ): UpdateEntryRequest {
    return { ...mockUpdateEntryRequest, ...overrides };
  }

  static createUpdated(): EntryModel {
    return this.create({
      description: 'Updated Test Entry',
      amount: 15000,
      recurrenceId: 'recurrence-1',
      updatedAt: new Date('2025-06-01T10:30:00Z'), // Later timestamp
    });
  }

  static createIncome(amount: number = 50000): EntryModel {
    return this.create({
      amount,
      categoryId: 'salary-category',
      category: {
        id: 'salary-category',
        name: 'Salary',
        type: 'INCOME' as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      description: 'Monthly Salary',
    });
  }

  static createExpense(amount: number = 10000): EntryModel {
    return this.create({
      amount,
      categoryId: 'food-category',
      category: {
        id: 'food-category',
        name: 'Food',
        type: 'EXPENSE' as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      description: 'Grocery Shopping',
    });
  }

  static createFixed(isFixed: boolean = true): EntryModel {
    return this.create({
      recurrenceId: isFixed ? 'recurrence-1' : null,
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
          issueDate: new Date(currentDate),
          dueDate: new Date(currentDate),
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
      issueDate: new Date(),
      dueDate: new Date(),
    };
  }

  static createInvalidUpdateRequest(): Partial<UpdateEntryRequest> {
    return {
      id: '',
      userId: '',
      description: '',
      amount: -100,
      categoryId: '',
      issueDate: new Date(),
      dueDate: new Date(),
    };
  }

  // Update-specific scenarios
  static createUpdateRequestForDifferentUser(): UpdateEntryRequest {
    return this.createUpdateRequest({
      userId: 'different-user-456',
    });
  }

  static createUpdateRequestWithInvalidCategory(): UpdateEntryRequest {
    return this.createUpdateRequest({
      categoryId: 'non-existent-category',
    });
  }
}
