import { DbListEntriesByMonthUseCase } from '@data/usecases';
import { EntryRepository, UserRepository } from '@data/protocols/repositories';
import { EntryModel, UserModel } from '@domain/models';

describe('DbListEntriesByMonthUseCase', () => {
  let sut: DbListEntriesByMonthUseCase;
  let mockEntryRepository: jest.Mocked<EntryRepository>;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockEntryRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findByUserIdAndMonth: jest.fn(),
      findByUserIdAndMonthWithFilters: jest.fn(),
      getMonthlySummaryStats: jest.fn(),
      getCategorySummaryForMonth: jest.fn(),
      getFixedEntriesSummary: jest.fn(),
      getCurrentBalance: jest.fn(),
      getDistinctMonthsYears: jest.fn(),
      getAccumulatedStats: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      softDelete: jest.fn(),
    };

    mockUserRepository = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
    };

    sut = new DbListEntriesByMonthUseCase(
      mockEntryRepository,
      mockUserRepository,
    );
  });

  describe('execute', () => {
    const mockUser: UserModel = {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashed-password',
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockEntries: EntryModel[] = [
      {
        id: 'entry-1',
        userId: 'user-123',
        description: 'Salary',
        amount: 5000,
        date: new Date('2025-01-15'),
        type: 'INCOME',
        isFixed: true,
        categoryId: null,
        isPaid: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        isFromPreviousMonth: false,
      },
      {
        id: 'entry-2',
        userId: 'user-123',
        description: 'Grocery shopping',
        amount: 200,
        date: new Date('2025-01-10'),
        type: 'EXPENSE',
        isFixed: false,
        categoryId: 'category-123',
        isPaid: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        isFromPreviousMonth: false,
      },
    ];

    const mockRepositoryResult = {
      data: mockEntries,
      total: 2,
      totalIncome: 5000,
      totalExpenses: 200,
    };

    it('should list entries for a valid month successfully with default pagination', async () => {
      const request = {
        userId: 'user-123',
        year: 2025,
        month: 1,
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockEntryRepository.findByUserIdAndMonthWithFilters.mockResolvedValue(
        mockRepositoryResult,
      );

      const result = await sut.execute(request);

      expect(result.data).toEqual(mockEntries);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      });
      expect(result.summary).toEqual({
        totalIncome: 5000,
        totalExpenses: 200,
        balance: 4800,
        entriesCount: 2,
      });
      expect(mockUserRepository.findById).toHaveBeenCalledWith('user-123');
      expect(
        mockEntryRepository.findByUserIdAndMonthWithFilters,
      ).toHaveBeenCalledWith({
        userId: 'user-123',
        year: 2025,
        month: 1,
        page: 1,
        limit: 20,
        sort: 'date',
        order: 'desc',
        type: 'all',
        categoryId: undefined,
      });
    });

    it('should list entries with custom pagination and filters', async () => {
      const request = {
        userId: 'user-123',
        year: 2025,
        month: 1,
        page: 2,
        limit: 10,
        sort: 'amount',
        order: 'asc' as const,
        type: 'INCOME' as const,
        categoryId: 'category-123',
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockEntryRepository.findByUserIdAndMonthWithFilters.mockResolvedValue(
        mockRepositoryResult,
      );

      const result = await sut.execute(request);

      expect(result.data).toEqual(mockEntries);
      expect(
        mockEntryRepository.findByUserIdAndMonthWithFilters,
      ).toHaveBeenCalledWith({
        userId: 'user-123',
        year: 2025,
        month: 1,
        page: 2,
        limit: 10,
        sort: 'amount',
        order: 'asc',
        type: 'INCOME',
        categoryId: 'category-123',
      });
    });

    it('should return empty data when no entries found for the month', async () => {
      const request = {
        userId: 'user-123',
        year: 2025,
        month: 2,
      };

      const emptyResult = {
        data: [],
        total: 0,
        totalIncome: 0,
        totalExpenses: 0,
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockEntryRepository.findByUserIdAndMonthWithFilters.mockResolvedValue(
        emptyResult,
      );

      const result = await sut.execute(request);

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.summary.entriesCount).toBe(0);
    });

    it('should validate and sanitize pagination parameters', async () => {
      const request = {
        userId: 'user-123',
        year: 2025,
        month: 1,
        page: -1, // Should be corrected to 1
        limit: 200, // Should be corrected to 100 (max)
        sort: 'invalid', // Should be corrected to "date"
        order: 'invalid' as any, // Should be corrected to "desc"
        type: 'invalid' as any, // Should be corrected to "all"
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockEntryRepository.findByUserIdAndMonthWithFilters.mockResolvedValue(
        mockRepositoryResult,
      );

      await sut.execute(request);

      expect(
        mockEntryRepository.findByUserIdAndMonthWithFilters,
      ).toHaveBeenCalledWith({
        userId: 'user-123',
        year: 2025,
        month: 1,
        page: 1, // Corrected
        limit: 100, // Corrected
        sort: 'date', // Corrected
        order: 'desc', // Corrected
        type: 'all', // Corrected
        categoryId: undefined,
      });
    });

    it('should throw error if user ID is not provided', async () => {
      const request = {
        userId: '',
        year: 2025,
        month: 1,
      };

      await expect(sut.execute(request)).rejects.toThrow('User ID is required');
    });

    it('should throw error if year is invalid', async () => {
      const request = {
        userId: 'user-123',
        year: 1899,
        month: 1,
      };

      await expect(sut.execute(request)).rejects.toThrow('Invalid year');
    });

    it('should throw error if month is invalid', async () => {
      const request = {
        userId: 'user-123',
        year: 2025,
        month: 13,
      };

      await expect(sut.execute(request)).rejects.toThrow('Invalid month');
    });

    it('should throw error if user is not found', async () => {
      const request = {
        userId: 'user-123',
        year: 2025,
        month: 1,
      };

      mockUserRepository.findById.mockResolvedValue(null);

      await expect(sut.execute(request)).rejects.toThrow('User not found');
      expect(mockUserRepository.findById).toHaveBeenCalledWith('user-123');
    });

    it('should apply minimum and maximum limits to pagination', async () => {
      const requestWithLargePage = {
        userId: 'user-123',
        year: 2025,
        month: 1,
        page: 0, // Should be adjusted to minimum 1
        limit: 150, // Should be adjusted to maximum 100
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockEntryRepository.findByUserIdAndMonthWithFilters.mockResolvedValue(
        mockRepositoryResult,
      );

      await sut.execute(requestWithLargePage);

      expect(
        mockEntryRepository.findByUserIdAndMonthWithFilters,
      ).toHaveBeenCalledWith({
        userId: 'user-123',
        year: 2025,
        month: 1,
        page: 1, // Adjusted to minimum
        limit: 100, // Adjusted to maximum
        sort: 'date',
        order: 'desc',
        type: 'all',
        categoryId: undefined,
      });
    });

    it('should default invalid sort field to date', async () => {
      const request = {
        userId: 'user-123',
        year: 2025,
        month: 1,
        sort: 'invalid-field',
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockEntryRepository.findByUserIdAndMonthWithFilters.mockResolvedValue(
        mockRepositoryResult,
      );

      await sut.execute(request);

      expect(
        mockEntryRepository.findByUserIdAndMonthWithFilters,
      ).toHaveBeenCalledWith({
        userId: 'user-123',
        year: 2025,
        month: 1,
        page: 1,
        limit: 20,
        sort: 'date', // Should default to 'date'
        order: 'desc',
        type: 'all',
        categoryId: undefined,
      });
    });

    it('should default invalid order to desc', async () => {
      const request = {
        userId: 'user-123',
        year: 2025,
        month: 1,
        order: 'invalid-order' as any,
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockEntryRepository.findByUserIdAndMonthWithFilters.mockResolvedValue(
        mockRepositoryResult,
      );

      await sut.execute(request);

      expect(
        mockEntryRepository.findByUserIdAndMonthWithFilters,
      ).toHaveBeenCalledWith({
        userId: 'user-123',
        year: 2025,
        month: 1,
        page: 1,
        limit: 20,
        sort: 'date',
        order: 'desc', // Should default to 'desc'
        type: 'all',
        categoryId: undefined,
      });
    });

    it('should default invalid type to all', async () => {
      const request = {
        userId: 'user-123',
        year: 2025,
        month: 1,
        type: 'INVALID' as any,
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockEntryRepository.findByUserIdAndMonthWithFilters.mockResolvedValue(
        mockRepositoryResult,
      );

      await sut.execute(request);

      expect(
        mockEntryRepository.findByUserIdAndMonthWithFilters,
      ).toHaveBeenCalledWith({
        userId: 'user-123',
        year: 2025,
        month: 1,
        page: 1,
        limit: 20,
        sort: 'date',
        order: 'desc',
        type: 'all', // Should default to 'all'
        categoryId: undefined,
      });
    });

    it('should calculate pagination metadata correctly', async () => {
      const request = {
        userId: 'user-123',
        year: 2025,
        month: 1,
        page: 2,
        limit: 1,
      };

      const paginatedResult = {
        data: [mockEntries[0]], // Only one entry for this page
        total: 2, // Total of 2 entries
        totalIncome: 5000,
        totalExpenses: 0,
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockEntryRepository.findByUserIdAndMonthWithFilters.mockResolvedValue(
        paginatedResult,
      );

      const result = await sut.execute(request);

      expect(result.pagination).toEqual({
        page: 2,
        limit: 1,
        total: 2,
        totalPages: 2,
        hasNext: false, // Page 2 is the last page
        hasPrev: true, // There's a previous page
      });
    });
  });
});
