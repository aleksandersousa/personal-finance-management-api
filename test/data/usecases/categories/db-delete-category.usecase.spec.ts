import { DbDeleteCategoryUseCase } from '@data/usecases';
import { CategoryRepositoryStub } from '@test/data/mocks/repositories';
import { MockCategoryFactory } from '@test/domain/mocks/models';

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
      const existingCategory = MockCategoryFactory.create({
        id: 'existing-category-id',
      });

      const deleteRequest = {
        id: 'existing-category-id',
        userId: 'user-123',
      };

      categoryRepositoryStub.seed([existingCategory], 'user-123');
      categoryRepositoryStub.mockHasEntriesAssociated(false);

      const result = await useCase.execute(deleteRequest);

      expect(result).toHaveProperty('deletedAt');
      expect(result.deletedAt).toBeInstanceOf(Date);
    });

    it('should throw error when category ID is not provided', async () => {
      const deleteRequest = {
        id: '',
        userId: 'user-123',
      };

      await expect(useCase.execute(deleteRequest)).rejects.toThrow(
        'Category ID is required',
      );
    });

    it('should throw error when user ID is not provided', async () => {
      const deleteRequest = {
        id: 'category-id',
        userId: '',
      };

      await expect(useCase.execute(deleteRequest)).rejects.toThrow(
        'User ID is required',
      );
    });

    it('should throw error when category does not exist', async () => {
      const deleteRequest = {
        id: 'non-existent-category',
        userId: 'user-123',
      };

      await expect(useCase.execute(deleteRequest)).rejects.toThrow(
        'Category not found',
      );
    });

    it('should throw error when user tries to delete category of another user', async () => {
      const existingCategory = MockCategoryFactory.create({
        id: 'existing-category-id',
      });

      const deleteRequest = {
        id: 'existing-category-id',
        userId: 'different-user',
      };

      categoryRepositoryStub.seed([existingCategory], 'owner-user');

      await expect(useCase.execute(deleteRequest)).rejects.toThrow(
        'You can only delete your own categories',
      );
    });

    it('should throw error when category has associated entries', async () => {
      const existingCategory = MockCategoryFactory.create({
        id: 'existing-category-id',
      });

      const deleteRequest = {
        id: 'existing-category-id',
        userId: 'user-123',
      };

      categoryRepositoryStub.seed([existingCategory], 'user-123');
      categoryRepositoryStub.mockHasEntriesAssociated(true);

      await expect(useCase.execute(deleteRequest)).rejects.toThrow(
        'Cannot delete category with existing entries',
      );
    });

    it('should handle repository errors', async () => {
      const existingCategory = MockCategoryFactory.create({
        id: 'existing-category-id',
      });

      const deleteRequest = {
        id: 'existing-category-id',
        userId: 'user-123',
      };

      categoryRepositoryStub.seed([existingCategory], 'user-123');
      categoryRepositoryStub.mockHasEntriesAssociated(false);
      categoryRepositoryStub.mockFailure(
        new Error('Database connection failed'),
      );

      await expect(useCase.execute(deleteRequest)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });
});
