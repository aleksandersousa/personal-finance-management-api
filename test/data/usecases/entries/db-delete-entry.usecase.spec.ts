import { DbDeleteEntryUseCase } from '@data/usecases';
import { EntryRepositoryStub } from '@test/data/mocks/repositories';
import { MockEntryFactory } from '@test/domain/mocks/models';

describe('DbDeleteEntryUseCase', () => {
  let useCase: DbDeleteEntryUseCase;
  let repositoryStub: EntryRepositoryStub;

  beforeEach(() => {
    repositoryStub = new EntryRepositoryStub();
    useCase = new DbDeleteEntryUseCase(repositoryStub);
  });

  afterEach(() => {
    repositoryStub.clear();
  });

  describe('execute', () => {
    it('should delete entry successfully when user owns it', async () => {
      // Arrange
      const entry = MockEntryFactory.create({
        id: 'entry-123',
        userId: 'user-123',
      });
      repositoryStub.seed([entry]);

      const requestData = {
        entryId: 'entry-123',
        userId: 'user-123',
      };

      // Act
      const result = await useCase.execute(requestData);

      // Assert
      expect(result).toHaveProperty('deletedAt');
      expect(result.deletedAt).toBeInstanceOf(Date);
    });

    it('should throw error when entry ID is not provided', async () => {
      // Arrange
      const requestData = {
        entryId: '',
        userId: 'user-123',
      };

      // Act & Assert
      await expect(useCase.execute(requestData)).rejects.toThrow(
        'Entry ID is required',
      );
    });

    it('should throw error when user ID is not provided', async () => {
      // Arrange
      const requestData = {
        entryId: 'entry-123',
        userId: '',
      };

      // Act & Assert
      await expect(useCase.execute(requestData)).rejects.toThrow(
        'User ID is required',
      );
    });

    it('should throw error when entry is not found', async () => {
      // Arrange
      const requestData = {
        entryId: 'non-existent-entry',
        userId: 'user-123',
      };

      // Act & Assert
      await expect(useCase.execute(requestData)).rejects.toThrow(
        'Entry not found',
      );
    });

    it('should throw error when user does not own the entry', async () => {
      // Arrange
      const entry = MockEntryFactory.create({
        id: 'entry-123',
        userId: 'other-user',
      });
      repositoryStub.seed([entry]);

      const requestData = {
        entryId: 'entry-123',
        userId: 'user-123',
      };

      // Act & Assert
      await expect(useCase.execute(requestData)).rejects.toThrow(
        'User does not own this entry',
      );
    });

    it('should handle repository errors', async () => {
      // Arrange
      const entry = MockEntryFactory.create({
        id: 'entry-123',
        userId: 'user-123',
      });
      repositoryStub.seed([entry]);
      repositoryStub.mockFailure(new Error('Database connection failed'));

      const requestData = {
        entryId: 'entry-123',
        userId: 'user-123',
      };

      // Act & Assert
      await expect(useCase.execute(requestData)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should validate input parameters types', async () => {
      // Arrange & Act & Assert
      await expect(
        useCase.execute({
          entryId: null as any,
          userId: 'user-123',
        }),
      ).rejects.toThrow('Entry ID is required');

      await expect(
        useCase.execute({
          entryId: 'entry-123',
          userId: null as any,
        }),
      ).rejects.toThrow('User ID is required');
    });

    it('should validate trimmed input parameters', async () => {
      // Arrange & Act & Assert
      await expect(
        useCase.execute({
          entryId: '   ',
          userId: 'user-123',
        }),
      ).rejects.toThrow('Entry ID is required');

      await expect(
        useCase.execute({
          entryId: 'entry-123',
          userId: '   ',
        }),
      ).rejects.toThrow('User ID is required');
    });
  });
});
