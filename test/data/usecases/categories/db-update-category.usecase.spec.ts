import { DbUpdateCategoryUseCase } from '@data/usecases';
import { CategoryRepositoryStub } from '@test/data/mocks/repositories';
import { MockCategoryFactory } from '@test/domain/mocks/models';

describe('DbUpdateCategoryUseCase', () => {
  let useCase: DbUpdateCategoryUseCase;
  let categoryRepositoryStub: CategoryRepositoryStub;

  beforeEach(() => {
    categoryRepositoryStub = new CategoryRepositoryStub();
    useCase = new DbUpdateCategoryUseCase(categoryRepositoryStub);
  });

  afterEach(() => {
    categoryRepositoryStub.clear();
  });

  describe('execute', () => {
    it('should update category with valid data', async () => {
      const existingCategory = MockCategoryFactory.create({
        id: 'existing-category-id',
        name: 'Original Name',
        description: 'Original Description',
      });

      const updateRequest = {
        id: 'existing-category-id',
        userId: 'user-123',
        name: 'Updated Name',
        description: 'Updated Description',
        color: '#FF5722',
        icon: 'updated_icon',
      };

      categoryRepositoryStub.seed([existingCategory], 'user-123');

      const result = await useCase.execute(updateRequest);

      expect(result).toHaveProperty('id', 'existing-category-id');
      expect(result.name).toBe('Updated Name');
      expect(result.description).toBe('Updated Description');
      expect(result.color).toBe('#FF5722');
      expect(result.icon).toBe('updated_icon');
    });

    it('should update only provided fields', async () => {
      const existingCategory = MockCategoryFactory.create({
        id: 'existing-category-id',
        name: 'Original Name',
        description: 'Original Description',
        color: '#000000',
        icon: 'original_icon',
      });

      const updateRequest = {
        id: 'existing-category-id',
        userId: 'user-123',
        name: 'Updated Name Only',
      };

      categoryRepositoryStub.seed([existingCategory], 'user-123');

      const result = await useCase.execute(updateRequest);

      expect(result.name).toBe('Updated Name Only');
      expect(result.description).toBe('Original Description');
      expect(result.color).toBe('#000000');
      expect(result.icon).toBe('original_icon');
    });

    it('should trim whitespace from name and description', async () => {
      const existingCategory = MockCategoryFactory.create({
        id: 'existing-category-id',
      });

      const updateRequest = {
        id: 'existing-category-id',
        userId: 'user-123',
        name: '  Trimmed Name  ',
        description: '  Trimmed Description  ',
      };

      categoryRepositoryStub.seed([existingCategory], 'user-123');

      const result = await useCase.execute(updateRequest);

      expect(result.name).toBe('Trimmed Name');
      expect(result.description).toBe('Trimmed Description');
    });

    it('should handle empty description by setting to undefined', async () => {
      const existingCategory = MockCategoryFactory.create({
        id: 'existing-category-id',
      });

      const updateRequest = {
        id: 'existing-category-id',
        userId: 'user-123',
        description: '   ',
      };

      categoryRepositoryStub.seed([existingCategory], 'user-123');

      const result = await useCase.execute(updateRequest);

      expect(result.description).toBeUndefined();
    });

    it('should throw error when category ID is not provided', async () => {
      const updateRequest = {
        id: '',
        userId: 'user-123',
        name: 'Updated Name',
      };

      await expect(useCase.execute(updateRequest)).rejects.toThrow(
        'Category ID is required',
      );
    });

    it('should throw error when user ID is not provided', async () => {
      const updateRequest = {
        id: 'category-id',
        userId: '',
        name: 'Updated Name',
      };

      await expect(useCase.execute(updateRequest)).rejects.toThrow(
        'User ID is required',
      );
    });

    it('should throw error when name is empty string', async () => {
      const existingCategory = MockCategoryFactory.create({
        id: 'existing-category-id',
      });

      const updateRequest = {
        id: 'existing-category-id',
        userId: 'user-123',
        name: '',
      };

      categoryRepositoryStub.seed([existingCategory], 'user-123');

      await expect(useCase.execute(updateRequest)).rejects.toThrow(
        'Category name cannot be empty',
      );
    });

    it('should throw error when name is only whitespace', async () => {
      const existingCategory = MockCategoryFactory.create({
        id: 'existing-category-id',
      });

      const updateRequest = {
        id: 'existing-category-id',
        userId: 'user-123',
        name: '   ',
      };

      categoryRepositoryStub.seed([existingCategory], 'user-123');

      await expect(useCase.execute(updateRequest)).rejects.toThrow(
        'Category name cannot be empty',
      );
    });

    it('should throw error when name exceeds 100 characters', async () => {
      const existingCategory = MockCategoryFactory.create({
        id: 'existing-category-id',
      });

      const updateRequest = {
        id: 'existing-category-id',
        userId: 'user-123',
        name: 'a'.repeat(101),
      };

      categoryRepositoryStub.seed([existingCategory], 'user-123');

      await expect(useCase.execute(updateRequest)).rejects.toThrow(
        'Category name must be 100 characters or less',
      );
    });

    it('should throw error when description exceeds 255 characters', async () => {
      const existingCategory = MockCategoryFactory.create({
        id: 'existing-category-id',
      });

      const updateRequest = {
        id: 'existing-category-id',
        userId: 'user-123',
        description: 'a'.repeat(256),
      };

      categoryRepositoryStub.seed([existingCategory], 'user-123');

      await expect(useCase.execute(updateRequest)).rejects.toThrow(
        'Category description must be 255 characters or less',
      );
    });

    it('should throw error when category does not exist', async () => {
      const updateRequest = {
        id: 'non-existent-category',
        userId: 'user-123',
        name: 'Updated Name',
      };

      await expect(useCase.execute(updateRequest)).rejects.toThrow(
        'Category not found',
      );
    });

    it('should throw error when user tries to update category of another user', async () => {
      const existingCategory = MockCategoryFactory.create({
        id: 'existing-category-id',
      });

      const updateRequest = {
        id: 'existing-category-id',
        userId: 'different-user',
        name: 'Updated Name',
      };

      categoryRepositoryStub.seed([existingCategory], 'owner-user');

      await expect(useCase.execute(updateRequest)).rejects.toThrow(
        'You can only update your own categories',
      );
    });

    it('should throw error when new name already exists for the user', async () => {
      const existingCategory1 = MockCategoryFactory.create({
        id: 'category-1',
        name: 'Original Name',
      });

      const existingCategory2 = MockCategoryFactory.create({
        id: 'category-2',
        name: 'Existing Name',
      });

      const updateRequest = {
        id: 'category-1',
        userId: 'user-123',
        name: 'Existing Name',
      };

      categoryRepositoryStub.seed(
        [existingCategory1, existingCategory2],
        'user-123',
      );

      await expect(useCase.execute(updateRequest)).rejects.toThrow(
        'Category name already exists for this user',
      );
    });

    it('should allow updating with same name (no change)', async () => {
      const existingCategory = MockCategoryFactory.create({
        id: 'existing-category-id',
        name: 'Same Name',
      });

      const updateRequest = {
        id: 'existing-category-id',
        userId: 'user-123',
        name: 'Same Name',
        description: 'Updated Description',
      };

      categoryRepositoryStub.seed([existingCategory], 'user-123');

      const result = await useCase.execute(updateRequest);

      expect(result.name).toBe('Same Name');
      expect(result.description).toBe('Updated Description');
    });

    it('should handle repository errors', async () => {
      const existingCategory = MockCategoryFactory.create({
        id: 'existing-category-id',
      });

      const updateRequest = {
        id: 'existing-category-id',
        userId: 'user-123',
        name: 'Updated Name',
      };

      categoryRepositoryStub.seed([existingCategory], 'user-123');
      categoryRepositoryStub.mockFailure(
        new Error('Database connection failed'),
      );

      await expect(useCase.execute(updateRequest)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });
});
