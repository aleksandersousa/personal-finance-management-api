import { DbToggleMonthlyPaymentStatusUseCase } from '@data/usecases';
import { EntryRepositoryStub } from '@test/data/mocks/repositories';
import { MockEntryFactory } from '@test/domain/mocks/models';

describe('DbToggleMonthlyPaymentStatusUseCase', () => {
  let useCase: DbToggleMonthlyPaymentStatusUseCase;
  let repositoryStub: EntryRepositoryStub;

  beforeEach(() => {
    repositoryStub = new EntryRepositoryStub();
    useCase = new DbToggleMonthlyPaymentStatusUseCase(repositoryStub);
  });

  afterEach(() => {
    repositoryStub.clear();
  });

  describe('execute', () => {
    it('should toggle monthly payment status successfully for a fixed entry', async () => {
      // Arrange
      const entry = MockEntryFactory.create({
        id: 'entry-123',
        userId: 'user-123',
        isFixed: true,
        deletedAt: null,
      });
      repositoryStub.seed([entry]);

      const request = {
        entryId: 'entry-123',
        userId: 'user-123',
        year: 2024,
        month: 1,
        isPaid: true,
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result).toMatchObject({
        entryId: 'entry-123',
        year: 2024,
        month: 1,
        isPaid: true,
      });
      expect(result).toHaveProperty('paidAt');
      expect(result.paidAt).toBeInstanceOf(Date);
    });

    it('should toggle to unpaid status successfully', async () => {
      // Arrange
      const entry = MockEntryFactory.create({
        id: 'entry-123',
        userId: 'user-123',
        isFixed: true,
        deletedAt: null,
      });
      repositoryStub.seed([entry]);

      const request = {
        entryId: 'entry-123',
        userId: 'user-123',
        year: 2024,
        month: 1,
        isPaid: false,
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result).toMatchObject({
        entryId: 'entry-123',
        year: 2024,
        month: 1,
        isPaid: false,
      });
      expect(result.paidAt).toBeNull();
    });

    it('should throw error when entry is not found', async () => {
      // Arrange
      const request = {
        entryId: 'non-existent-entry',
        userId: 'user-123',
        year: 2024,
        month: 1,
        isPaid: true,
      };

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow('Entry not found');
    });

    it('should throw error when user does not own the entry', async () => {
      // Arrange
      const entry = MockEntryFactory.create({
        id: 'entry-123',
        userId: 'user-456',
        isFixed: true,
        deletedAt: null,
      });
      repositoryStub.seed([entry]);

      const request = {
        entryId: 'entry-123',
        userId: 'user-123',
        year: 2024,
        month: 1,
        isPaid: true,
      };

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow(
        'Unauthorized: Entry does not belong to user',
      );
    });

    it('should throw error when entry is not a fixed entry', async () => {
      // Arrange
      const entry = MockEntryFactory.create({
        id: 'entry-123',
        userId: 'user-123',
        isFixed: false,
        deletedAt: null,
      });
      repositoryStub.seed([entry]);

      const request = {
        entryId: 'entry-123',
        userId: 'user-123',
        year: 2024,
        month: 1,
        isPaid: true,
      };

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow(
        'Cannot set monthly payment status for non-fixed entries',
      );
    });
  });
});
