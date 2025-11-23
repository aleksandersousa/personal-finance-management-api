import { DbDeleteCategoryUseCase } from '../../../src/data/usecases/db-delete-category.usecase';
import { CategoryRepositoryStub } from '../mocks/repositories/category-repository.stub';
import { MockCategoryFactory } from '../../domain/mocks/models/category.mock';

describe('DbDeleteCategoryUseCase', () => {
  let useCase: DbDeleteCategoryUseCase;
  let categoryRepositoryStub: CategoryRepositoryStub;

  beforeEach(() => {
    categoryRepositoryStub = new CategoryRepositoryStub();
    useCase = new DbDeleteCategoryUseCase(categoryRepositoryStub);
  });

  afterEach(() => {
    categoryRepositoryStub.clear();
  });

  describe('execute', () => {
    it('should delete category successfully', async () => {
      // Arrange
      const existingCategory = MockCategoryFactory.create({
        id: 'existing-category-id',
        userId: 'user-123',
        isDefault: false,
      });

      const deleteRequest = {
        id: 'existing-category-id',
        userId: 'user-123',
      };

      categoryRepositoryStub.seed([existingCategory]);
      categoryRepositoryStub.mockHasEntriesAssociated(false);

      // Act
      const result = await useCase.execute(deleteRequest);

      // Assert
      expect(result).toHaveProperty('deletedAt');
      expect(result.deletedAt).toBeInstanceOf(Date);
    });

    it('should throw error when category ID is not provided', async () => {
      // Arrange
      const deleteRequest = {
        id: '',
        userId: 'user-123',
      };

      // Act & Assert
      await expect(useCase.execute(deleteRequest)).rejects.toThrow(
        'Category ID is required',
      );
    });

    it('should throw error when user ID is not provided', async () => {
      // Arrange
      const deleteRequest = {
        id: 'category-id',
        userId: '',
      };

      // Act & Assert
      await expect(useCase.execute(deleteRequest)).rejects.toThrow(
        'User ID is required',
      );
    });

    it('should throw error when category does not exist', async () => {
      // Arrange
      const deleteRequest = {
        id: 'non-existent-category',
        userId: 'user-123',
      };

      // Act & Assert
      await expect(useCase.execute(deleteRequest)).rejects.toThrow(
        'Category not found',
      );
    });

    it('should throw error when user tries to delete category of another user', async () => {
      // Arrange
      const existingCategory = MockCategoryFactory.create({
        id: 'existing-category-id',
        userId: 'owner-user',
        isDefault: false,
      });

      const deleteRequest = {
        id: 'existing-category-id',
        userId: 'different-user',
      };

      categoryRepositoryStub.seed([existingCategory]);

      // Act & Assert
      await expect(useCase.execute(deleteRequest)).rejects.toThrow(
        'You can only delete your own categories',
      );
    });

    it('should throw error when trying to delete default category', async () => {
      // Arrange
      const defaultCategory = MockCategoryFactory.create({
        id: 'default-category-id',
        userId: 'user-123',
        isDefault: true,
      });

      const deleteRequest = {
        id: 'default-category-id',
        userId: 'user-123',
      };

      categoryRepositoryStub.seed([defaultCategory]);

      // Act & Assert
      await expect(useCase.execute(deleteRequest)).rejects.toThrow(
        'Cannot delete default categories',
      );
    });

    it('should throw error when category has associated entries', async () => {
      // Arrange
      const existingCategory = MockCategoryFactory.create({
        id: 'existing-category-id',
        userId: 'user-123',
        isDefault: false,
      });

      const deleteRequest = {
        id: 'existing-category-id',
        userId: 'user-123',
      };

      categoryRepositoryStub.seed([existingCategory]);
      categoryRepositoryStub.mockHasEntriesAssociated(true);

      // Act & Assert
      await expect(useCase.execute(deleteRequest)).rejects.toThrow(
        'Cannot delete category with existing entries',
      );
    });

    it('should handle repository errors', async () => {
      // Arrange
      const existingCategory = MockCategoryFactory.create({
        id: 'existing-category-id',
        userId: 'user-123',
        isDefault: false,
      });

      const deleteRequest = {
        id: 'existing-category-id',
        userId: 'user-123',
      };

      categoryRepositoryStub.seed([existingCategory]);
      categoryRepositoryStub.mockHasEntriesAssociated(false);
      categoryRepositoryStub.mockFailure(
        new Error('Database connection failed'),
      );

      // Act & Assert
      await expect(useCase.execute(deleteRequest)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });
});
