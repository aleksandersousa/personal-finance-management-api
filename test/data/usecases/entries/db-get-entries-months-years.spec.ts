import { DbGetEntriesMonthsYearsUseCase } from '@data/usecases';
import {
  EntryRepositoryStub,
  UserRepositoryStub,
} from '@test/data/mocks/repositories';
import { MockUserFactory, MockEntryFactory } from '@test/domain/mocks/models';
import { LoggerStub } from '@test/data/mocks/protocols';

describe('DbGetEntriesMonthsYearsUseCase', () => {
  let sut: DbGetEntriesMonthsYearsUseCase;
  let entryRepositoryStub: EntryRepositoryStub;
  let userRepositoryStub: UserRepositoryStub;
  let loggerStub: LoggerStub;

  beforeEach(() => {
    entryRepositoryStub = new EntryRepositoryStub();
    userRepositoryStub = new UserRepositoryStub();
    loggerStub = new LoggerStub();

    sut = new DbGetEntriesMonthsYearsUseCase(
      entryRepositoryStub,
      userRepositoryStub,
      loggerStub,
    );
  });

  afterEach(() => {
    entryRepositoryStub.clear();
    userRepositoryStub.clear();
  });

  describe('execute', () => {
    const mockUser = MockUserFactory.create({
      id: 'valid-user-id',
      name: 'John Doe',
      email: 'john@example.com',
    });

    const mockRequest = {
      userId: 'valid-user-id',
    };

    it('should return distinct months and years successfully', async () => {
      // Arrange
      userRepositoryStub.seed([mockUser]);

      const entry1 = MockEntryFactory.create({
        id: 'entry-1',
        userId: 'valid-user-id',
        date: new Date('2024-01-15'),
        amount: 1000,
        description: 'Entry 1',
        type: 'INCOME',
        isFixed: false,
      });

      const entry2 = MockEntryFactory.create({
        id: 'entry-2',
        userId: 'valid-user-id',
        date: new Date('2024-02-20'),
        amount: 2000,
        description: 'Entry 2',
        type: 'INCOME',
        isFixed: false,
      });

      const entry3 = MockEntryFactory.create({
        id: 'entry-3',
        userId: 'valid-user-id',
        date: new Date('2024-01-10'),
        amount: 500,
        description: 'Entry 3',
        type: 'EXPENSE',
        isFixed: false,
      });

      entryRepositoryStub.seed([entry1, entry2, entry3]);

      // Act
      const result = await sut.execute(mockRequest);

      // Assert
      expect(result.monthsYears).toHaveLength(2);
      expect(result.monthsYears).toEqual([
        { year: 2024, month: 2 },
        { year: 2024, month: 1 },
      ]);
    });

    it('should return empty array when user has no entries', async () => {
      // Arrange
      userRepositoryStub.seed([mockUser]);

      // Act
      const result = await sut.execute(mockRequest);

      // Assert
      expect(result.monthsYears).toHaveLength(0);
      expect(result.monthsYears).toEqual([]);
    });

    it('should exclude deleted entries from results', async () => {
      // Arrange
      userRepositoryStub.seed([mockUser]);

      const entry1 = MockEntryFactory.create({
        id: 'entry-1',
        userId: 'valid-user-id',
        date: new Date('2024-01-15'),
        amount: 1000,
        description: 'Entry 1',
        type: 'INCOME',
        isFixed: false,
        deletedAt: null,
      });

      const entry2 = MockEntryFactory.create({
        id: 'entry-2',
        userId: 'valid-user-id',
        date: new Date('2024-02-20'),
        amount: 2000,
        description: 'Entry 2',
        type: 'INCOME',
        isFixed: false,
        deletedAt: new Date(), // Deleted entry
      });

      entryRepositoryStub.seed([entry1, entry2]);

      // Act
      const result = await sut.execute(mockRequest);

      // Assert
      expect(result.monthsYears).toHaveLength(1);
      expect(result.monthsYears).toEqual([{ year: 2024, month: 1 }]);
    });

    it('should return months and years sorted in descending order', async () => {
      // Arrange
      userRepositoryStub.seed([mockUser]);

      const entries = [
        MockEntryFactory.create({
          id: 'entry-1',
          userId: 'valid-user-id',
          date: new Date('2023-03-15'),
          amount: 1000,
          description: 'Entry 1',
          type: 'INCOME',
          isFixed: false,
        }),
        MockEntryFactory.create({
          id: 'entry-2',
          userId: 'valid-user-id',
          date: new Date('2024-01-20'),
          amount: 2000,
          description: 'Entry 2',
          type: 'INCOME',
          isFixed: false,
        }),
        MockEntryFactory.create({
          id: 'entry-3',
          userId: 'valid-user-id',
          date: new Date('2024-05-10'),
          amount: 500,
          description: 'Entry 3',
          type: 'EXPENSE',
          isFixed: false,
        }),
        MockEntryFactory.create({
          id: 'entry-4',
          userId: 'valid-user-id',
          date: new Date('2023-12-25'),
          amount: 3000,
          description: 'Entry 4',
          type: 'INCOME',
          isFixed: false,
        }),
      ];

      entryRepositoryStub.seed(entries);

      // Act
      const result = await sut.execute(mockRequest);

      // Assert
      expect(result.monthsYears).toHaveLength(4);
      expect(result.monthsYears).toEqual([
        { year: 2024, month: 5 },
        { year: 2024, month: 1 },
        { year: 2023, month: 12 },
        { year: 2023, month: 3 },
      ]);
    });

    it('should handle entries from multiple years', async () => {
      // Arrange
      userRepositoryStub.seed([mockUser]);

      const entries = [
        MockEntryFactory.create({
          id: 'entry-1',
          userId: 'valid-user-id',
          date: new Date('2022-06-15'),
          amount: 1000,
          description: 'Entry 1',
          type: 'INCOME',
          isFixed: false,
        }),
        MockEntryFactory.create({
          id: 'entry-2',
          userId: 'valid-user-id',
          date: new Date('2024-01-20'),
          amount: 2000,
          description: 'Entry 2',
          type: 'INCOME',
          isFixed: false,
        }),
        MockEntryFactory.create({
          id: 'entry-3',
          userId: 'valid-user-id',
          date: new Date('2023-11-10'),
          amount: 500,
          description: 'Entry 3',
          type: 'EXPENSE',
          isFixed: false,
        }),
      ];

      entryRepositoryStub.seed(entries);

      // Act
      const result = await sut.execute(mockRequest);

      // Assert
      expect(result.monthsYears).toHaveLength(3);
      expect(result.monthsYears).toEqual([
        { year: 2024, month: 1 },
        { year: 2023, month: 11 },
        { year: 2022, month: 6 },
      ]);
    });

    it('should throw error if user ID is not provided', async () => {
      // Arrange
      const invalidRequest = {
        userId: '',
      };

      // Act & Assert
      await expect(sut.execute(invalidRequest)).rejects.toThrow(
        'User ID is required',
      );
    });

    it('should throw error if user ID is null', async () => {
      // Arrange
      const invalidRequest = {
        userId: null as any,
      };

      // Act & Assert
      await expect(sut.execute(invalidRequest)).rejects.toThrow(
        'User ID is required',
      );
    });

    it('should throw error if user not found', async () => {
      // Arrange
      // User not seeded - simulates user not found

      // Act & Assert
      await expect(sut.execute(mockRequest)).rejects.toThrow('User not found');
    });

    it('should handle repository errors', async () => {
      // Arrange
      userRepositoryStub.seed([mockUser]);
      entryRepositoryStub.mockConnectionError();

      // Act & Assert
      await expect(sut.execute(mockRequest)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle user repository errors', async () => {
      // Arrange
      userRepositoryStub.mockConnectionError();

      // Act & Assert
      await expect(sut.execute(mockRequest)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should not include entries from other users', async () => {
      // Arrange
      userRepositoryStub.seed([mockUser]);

      const entry1 = MockEntryFactory.create({
        id: 'entry-1',
        userId: 'valid-user-id',
        date: new Date('2024-01-15'),
        amount: 1000,
        description: 'Entry 1',
        type: 'INCOME',
        isFixed: false,
      });

      const entry2 = MockEntryFactory.create({
        id: 'entry-2',
        userId: 'other-user-id',
        date: new Date('2024-02-20'),
        amount: 2000,
        description: 'Entry 2',
        type: 'INCOME',
        isFixed: false,
      });

      entryRepositoryStub.seed([entry1, entry2]);

      // Act
      const result = await sut.execute(mockRequest);

      // Assert
      expect(result.monthsYears).toHaveLength(1);
      expect(result.monthsYears).toEqual([{ year: 2024, month: 1 }]);
    });
  });
});
