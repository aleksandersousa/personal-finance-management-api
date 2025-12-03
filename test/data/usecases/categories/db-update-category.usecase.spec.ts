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
      // Arrange
      const existingCategory = MockCategoryFactory.create({
        id: 'existing-category-id',
        userId: 'user-123',
        name: 'Original Name',
        description: 'Original Description',
        isDefault: false,
      });

      const updateRequest = {
        id: 'existing-category-id',
        userId: 'user-123',
        name: 'Updated Name',
        description: 'Updated Description',
        color: '#FF5722',
        icon: 'updated_icon',
      };

      categoryRepositoryStub.seed([existingCategory]);

      // Act
      const result = await useCase.execute(updateRequest);

      // Assert
      expect(result).toHaveProperty('id', 'existing-category-id');
      expect(result.name).toBe('Updated Name');
      expect(result.description).toBe('Updated Description');
      expect(result.color).toBe('#FF5722');
      expect(result.icon).toBe('updated_icon');
    });

    it('should update only provided fields', async () => {
      // Arrange
      const existingCategory = MockCategoryFactory.create({
        id: 'existing-category-id',
        userId: 'user-123',
        name: 'Original Name',
        description: 'Original Description',
        color: '#000000',
        icon: 'original_icon',
        isDefault: false,
      });

      const updateRequest = {
        id: 'existing-category-id',
        userId: 'user-123',
        name: 'Updated Name Only',
      };

      categoryRepositoryStub.seed([existingCategory]);

      // Act
      const result = await useCase.execute(updateRequest);

      // Assert
      expect(result.name).toBe('Updated Name Only');
      expect(result.description).toBe('Original Description'); // Should remain unchanged
      expect(result.color).toBe('#000000'); // Should remain unchanged
      expect(result.icon).toBe('original_icon'); // Should remain unchanged
    });

    it('should trim whitespace from name and description', async () => {
      // Arrange
      const existingCategory = MockCategoryFactory.create({
        id: 'existing-category-id',
        userId: 'user-123',
        isDefault: false,
      });

      const updateRequest = {
        id: 'existing-category-id',
        userId: 'user-123',
        name: '  Trimmed Name  ',
        description: '  Trimmed Description  ',
      };

      categoryRepositoryStub.seed([existingCategory]);

      // Act
      const result = await useCase.execute(updateRequest);

      // Assert
      expect(result.name).toBe('Trimmed Name');
      expect(result.description).toBe('Trimmed Description');
    });

    it('should handle empty description by setting to undefined', async () => {
      // Arrange
      const existingCategory = MockCategoryFactory.create({
        id: 'existing-category-id',
        userId: 'user-123',
        isDefault: false,
      });

      const updateRequest = {
        id: 'existing-category-id',
        userId: 'user-123',
        description: '   ',
      };

      categoryRepositoryStub.seed([existingCategory]);

      // Act
      const result = await useCase.execute(updateRequest);

      // Assert
      expect(result.description).toBeUndefined();
    });

    it('should throw error when category ID is not provided', async () => {
      // Arrange
      const updateRequest = {
        id: '',
        userId: 'user-123',
        name: 'Updated Name',
      };

      // Act & Assert
      await expect(useCase.execute(updateRequest)).rejects.toThrow(
        'Category ID is required',
      );
    });

    it('should throw error when user ID is not provided', async () => {
      // Arrange
      const updateRequest = {
        id: 'category-id',
        userId: '',
        name: 'Updated Name',
      };

      // Act & Assert
      await expect(useCase.execute(updateRequest)).rejects.toThrow(
        'User ID is required',
      );
    });

    it('should throw error when name is empty string', async () => {
      // Arrange
      const existingCategory = MockCategoryFactory.create({
        id: 'existing-category-id',
        userId: 'user-123',
        isDefault: false,
      });

      const updateRequest = {
        id: 'existing-category-id',
        userId: 'user-123',
        name: '',
      };

      categoryRepositoryStub.seed([existingCategory]);

      // Act & Assert
      await expect(useCase.execute(updateRequest)).rejects.toThrow(
        'Category name cannot be empty',
      );
    });

    it('should throw error when name is only whitespace', async () => {
      // Arrange
      const existingCategory = MockCategoryFactory.create({
        id: 'existing-category-id',
        userId: 'user-123',
        isDefault: false,
      });

      const updateRequest = {
        id: 'existing-category-id',
        userId: 'user-123',
        name: '   ',
      };

      categoryRepositoryStub.seed([existingCategory]);

      // Act & Assert
      await expect(useCase.execute(updateRequest)).rejects.toThrow(
        'Category name cannot be empty',
      );
    });

    it('should throw error when name exceeds 100 characters', async () => {
      // Arrange
      const existingCategory = MockCategoryFactory.create({
        id: 'existing-category-id',
        userId: 'user-123',
        isDefault: false,
      });

      const updateRequest = {
        id: 'existing-category-id',
        userId: 'user-123',
        name: 'a'.repeat(101),
      };

      categoryRepositoryStub.seed([existingCategory]);

      // Act & Assert
      await expect(useCase.execute(updateRequest)).rejects.toThrow(
        'Category name must be 100 characters or less',
      );
    });

    it('should throw error when description exceeds 255 characters', async () => {
      // Arrange
      const existingCategory = MockCategoryFactory.create({
        id: 'existing-category-id',
        userId: 'user-123',
        isDefault: false,
      });

      const updateRequest = {
        id: 'existing-category-id',
        userId: 'user-123',
        description: 'a'.repeat(256),
      };

      categoryRepositoryStub.seed([existingCategory]);

      // Act & Assert
      await expect(useCase.execute(updateRequest)).rejects.toThrow(
        'Category description must be 255 characters or less',
      );
    });

    it('should throw error when category does not exist', async () => {
      // Arrange
      const updateRequest = {
        id: 'non-existent-category',
        userId: 'user-123',
        name: 'Updated Name',
      };

      // Act & Assert
      await expect(useCase.execute(updateRequest)).rejects.toThrow(
        'Category not found',
      );
    });

    it('should throw error when user tries to update category of another user', async () => {
      // Arrange
      const existingCategory = MockCategoryFactory.create({
        id: 'existing-category-id',
        userId: 'owner-user',
        isDefault: false,
      });

      const updateRequest = {
        id: 'existing-category-id',
        userId: 'different-user',
        name: 'Updated Name',
      };

      categoryRepositoryStub.seed([existingCategory]);

      // Act & Assert
      await expect(useCase.execute(updateRequest)).rejects.toThrow(
        'You can only update your own categories',
      );
    });

    it('should throw error when trying to update default category', async () => {
      // Arrange
      const defaultCategory = MockCategoryFactory.create({
        id: 'default-category-id',
        userId: 'user-123',
        isDefault: true,
      });

      const updateRequest = {
        id: 'default-category-id',
        userId: 'user-123',
        name: 'Updated Default Name',
      };

      categoryRepositoryStub.seed([defaultCategory]);

      // Act & Assert
      await expect(useCase.execute(updateRequest)).rejects.toThrow(
        'Cannot update default categories',
      );
    });

    it('should throw error when new name already exists for the user', async () => {
      // Arrange
      const existingCategory1 = MockCategoryFactory.create({
        id: 'category-1',
        userId: 'user-123',
        name: 'Original Name',
        isDefault: false,
      });

      const existingCategory2 = MockCategoryFactory.create({
        id: 'category-2',
        userId: 'user-123',
        name: 'Existing Name',
        isDefault: false,
      });

      const updateRequest = {
        id: 'category-1',
        userId: 'user-123',
        name: 'Existing Name', // This name already exists
      };

      categoryRepositoryStub.seed([existingCategory1, existingCategory2]);

      // Act & Assert
      await expect(useCase.execute(updateRequest)).rejects.toThrow(
        'Category name already exists for this user',
      );
    });

    it('should allow updating with same name (no change)', async () => {
      // Arrange
      const existingCategory = MockCategoryFactory.create({
        id: 'existing-category-id',
        userId: 'user-123',
        name: 'Same Name',
        isDefault: false,
      });

      const updateRequest = {
        id: 'existing-category-id',
        userId: 'user-123',
        name: 'Same Name',
        description: 'Updated Description',
      };

      categoryRepositoryStub.seed([existingCategory]);

      // Act
      const result = await useCase.execute(updateRequest);

      // Assert
      expect(result.name).toBe('Same Name');
      expect(result.description).toBe('Updated Description');
    });

    it('should handle repository errors', async () => {
      // Arrange
      const existingCategory = MockCategoryFactory.create({
        id: 'existing-category-id',
        userId: 'user-123',
        isDefault: false,
      });

      const updateRequest = {
        id: 'existing-category-id',
        userId: 'user-123',
        name: 'Updated Name',
      };

      categoryRepositoryStub.seed([existingCategory]);
      categoryRepositoryStub.mockFailure(
        new Error('Database connection failed'),
      );

      // Act & Assert
      await expect(useCase.execute(updateRequest)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });
});
