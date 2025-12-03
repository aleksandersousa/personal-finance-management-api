import { DbUpdateEntryUseCase } from '@data/usecases';
import {
  EntryRepositoryStub,
  UserRepositoryStub,
  CategoryRepositoryStub,
} from '@test/data/mocks/repositories';
import {
  MockEntryFactory,
  MockUserFactory,
  MockCategoryFactory,
} from '@test/domain/mocks/models';

describe('DbUpdateEntryUseCase', () => {
  let useCase: DbUpdateEntryUseCase;
  let entryRepositoryStub: EntryRepositoryStub;
  let userRepositoryStub: UserRepositoryStub;
  let categoryRepositoryStub: CategoryRepositoryStub;

  beforeEach(() => {
    entryRepositoryStub = new EntryRepositoryStub();
    userRepositoryStub = new UserRepositoryStub();
    categoryRepositoryStub = new CategoryRepositoryStub();
    useCase = new DbUpdateEntryUseCase(
      entryRepositoryStub,
      userRepositoryStub,
      categoryRepositoryStub,
    );
  });

  afterEach(() => {
    entryRepositoryStub.clear();
    userRepositoryStub.clear();
    categoryRepositoryStub.clear();
  });

  describe('execute', () => {
    it('should update entry with valid data', async () => {
      // Arrange
      const existingEntry = MockEntryFactory.create();
      const user = MockUserFactory.create({ id: existingEntry.userId });
      const category = MockCategoryFactory.create({
        id: 'category-456',
        userId: existingEntry.userId,
      });
      const updateRequest = MockEntryFactory.createUpdateRequest({
        id: existingEntry.id,
        userId: existingEntry.userId,
        categoryId: category.id,
      });

      entryRepositoryStub.seed([existingEntry]);
      userRepositoryStub.seed([user]);
      categoryRepositoryStub.seed([category]);

      // Act
      const result = await useCase.execute(updateRequest);

      // Assert
      expect(result).toHaveProperty('id', existingEntry.id);
      expect(result.description).toBe(updateRequest.description);
      expect(result.amount).toBe(updateRequest.amount);
      expect(result.type).toBe(updateRequest.type);
      expect(result.isFixed).toBe(updateRequest.isFixed);
      expect(result.categoryId).toBe(updateRequest.categoryId);
      expect(result.userId).toBe(updateRequest.userId);
    });

    it('should throw error when entry ID is missing', async () => {
      // Arrange
      const updateRequest = MockEntryFactory.createUpdateRequest({ id: '' });

      // Act & Assert
      await expect(useCase.execute(updateRequest)).rejects.toThrow(
        'Entry ID is required',
      );
    });

    it('should throw error when user ID is missing', async () => {
      // Arrange
      const updateRequest = MockEntryFactory.createUpdateRequest({
        userId: '',
      });

      // Act & Assert
      await expect(useCase.execute(updateRequest)).rejects.toThrow(
        'User ID is required',
      );
    });

    it('should throw error when amount is zero or negative', async () => {
      // Arrange
      const updateRequest = MockEntryFactory.createUpdateRequest({ amount: 0 });

      // Act & Assert
      await expect(useCase.execute(updateRequest)).rejects.toThrow(
        'Amount must be greater than zero',
      );
    });

    it('should throw error when description is empty', async () => {
      // Arrange
      const updateRequest = MockEntryFactory.createUpdateRequest({
        description: '',
      });

      // Act & Assert
      await expect(useCase.execute(updateRequest)).rejects.toThrow(
        'Description is required',
      );
    });

    it('should throw error when user does not exist', async () => {
      // Arrange
      const updateRequest = MockEntryFactory.createUpdateRequest();

      // Act & Assert
      await expect(useCase.execute(updateRequest)).rejects.toThrow(
        'User not found',
      );
    });

    it('should throw error when entry does not exist', async () => {
      // Arrange
      const user = MockUserFactory.create();
      const updateRequest = MockEntryFactory.createUpdateRequest({
        userId: user.id,
      });

      userRepositoryStub.seed([user]);

      // Act & Assert
      await expect(useCase.execute(updateRequest)).rejects.toThrow(
        'Entry not found',
      );
    });

    it('should throw error when user tries to update entry of another user', async () => {
      // Arrange
      const existingEntry = MockEntryFactory.create({ userId: 'owner-user' });
      const requestingUser = MockUserFactory.create({ id: 'different-user' });
      const updateRequest = MockEntryFactory.createUpdateRequest({
        id: existingEntry.id,
        userId: requestingUser.id,
      });

      entryRepositoryStub.seed([existingEntry]);
      userRepositoryStub.seed([requestingUser]);

      // Act & Assert
      await expect(useCase.execute(updateRequest)).rejects.toThrow(
        'You can only update your own entries',
      );
    });

    it('should throw error when category does not exist', async () => {
      // Arrange
      const existingEntry = MockEntryFactory.create();
      const user = MockUserFactory.create({ id: existingEntry.userId });
      const updateRequest = MockEntryFactory.createUpdateRequest({
        id: existingEntry.id,
        userId: existingEntry.userId,
        categoryId: 'non-existent-category',
      });

      entryRepositoryStub.seed([existingEntry]);
      userRepositoryStub.seed([user]);

      // Act & Assert
      await expect(useCase.execute(updateRequest)).rejects.toThrow(
        'Category not found',
      );
    });

    it('should throw error when category belongs to different user', async () => {
      // Arrange
      const existingEntry = MockEntryFactory.create({ userId: 'user-123' });
      const user = MockUserFactory.create({ id: existingEntry.userId });
      const category = MockCategoryFactory.create({
        id: 'category-456',
        userId: 'different-user',
      });
      const updateRequest = MockEntryFactory.createUpdateRequest({
        id: existingEntry.id,
        userId: existingEntry.userId,
        categoryId: category.id,
      });

      entryRepositoryStub.seed([existingEntry]);
      userRepositoryStub.seed([user]);
      categoryRepositoryStub.seed([category]);

      // Act & Assert
      await expect(useCase.execute(updateRequest)).rejects.toThrow(
        'Category does not belong to the user',
      );
    });

    it('should update entry without category when categoryId is not provided', async () => {
      // Arrange
      const existingEntry = MockEntryFactory.create();
      const user = MockUserFactory.create({ id: existingEntry.userId });
      const updateRequest = MockEntryFactory.createUpdateRequest({
        id: existingEntry.id,
        userId: existingEntry.userId,
        categoryId: undefined,
      });

      entryRepositoryStub.seed([existingEntry]);
      userRepositoryStub.seed([user]);

      // Act
      const result = await useCase.execute(updateRequest);

      // Assert
      expect(result).toHaveProperty('id', existingEntry.id);
      expect(result.categoryId).toBeUndefined();
    });

    it('should handle repository errors', async () => {
      // Arrange
      const existingEntry = MockEntryFactory.create();
      const user = MockUserFactory.create({ id: existingEntry.userId });
      const updateRequest = MockEntryFactory.createUpdateRequest({
        id: existingEntry.id,
        userId: existingEntry.userId,
      });

      entryRepositoryStub.seed([existingEntry]);
      userRepositoryStub.seed([user]);
      entryRepositoryStub.mockFailure(new Error('Database connection failed'));

      // Act & Assert
      await expect(useCase.execute(updateRequest)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });
});
