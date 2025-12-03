import { DbAddCategoryUseCase } from '@data/usecases/db-add-category.usecase';
import { CategoryRepositoryStub } from '@test/data/mocks/repositories';
import {
  MockCategoryFactory,
  MockCategoryCreateDataFactory,
} from '@test/domain/mocks/models';
import { CategoryType } from '@domain/models/category.model';

describe('DbAddCategoryUseCase', () => {
  let useCase: DbAddCategoryUseCase;
  let categoryRepositoryStub: CategoryRepositoryStub;

  beforeEach(() => {
    categoryRepositoryStub = new CategoryRepositoryStub();
    useCase = new DbAddCategoryUseCase(categoryRepositoryStub);
  });

  afterEach(() => {
    categoryRepositoryStub.clear();
  });

  describe('execute', () => {
    it('should create category with valid data', async () => {
      // Arrange
      const inputData = MockCategoryCreateDataFactory.createValid();

      // Act
      const result = await useCase.execute(inputData);

      // Assert
      expect(result).toHaveProperty('id');
      expect(result.name).toBe(inputData.name);
      expect(result.description).toBe(inputData.description);
      expect(result.type).toBe(inputData.type);
      expect(result.color).toBe(inputData.color);
      expect(result.icon).toBe(inputData.icon);
      expect(result.userId).toBe(inputData.userId);
      expect(result.isDefault).toBe(false);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(categoryRepositoryStub.getCount()).toBe(1);
    });

    it('should create expense category successfully', async () => {
      // Arrange
      const inputData = MockCategoryCreateDataFactory.createExpense();

      // Act
      const result = await useCase.execute(inputData);

      // Assert
      expect(result.type).toBe(CategoryType.EXPENSE);
      expect(result.name).toBe('Housing');
      expect(result.color).toBe('#F44336');
      expect(result.icon).toBe('home');
    });

    it('should trim name and description', async () => {
      // Arrange
      const inputData = MockCategoryCreateDataFactory.create({
        name: '  Freelance Work  ',
        description: '  Income from projects  ',
      });

      // Act
      const result = await useCase.execute(inputData);

      // Assert
      expect(result.name).toBe('Freelance Work');
      expect(result.description).toBe('Income from projects');
    });

    it('should create category without optional fields', async () => {
      // Arrange
      const inputData = MockCategoryCreateDataFactory.create({
        description: undefined,
        color: undefined,
        icon: undefined,
      });

      // Act
      const result = await useCase.execute(inputData);

      // Assert
      expect(result.name).toBe(inputData.name);
      expect(result.description).toBeUndefined();
      expect(result.color).toBeUndefined();
      expect(result.icon).toBeUndefined();
    });

    it('should throw error for empty name', async () => {
      // Arrange
      const inputData = MockCategoryCreateDataFactory.create({ name: '' });

      // Act & Assert
      await expect(useCase.execute(inputData)).rejects.toThrow(
        'Category name is required',
      );
      expect(categoryRepositoryStub.getCount()).toBe(0);
    });

    it('should throw error for whitespace-only name', async () => {
      // Arrange
      const inputData = MockCategoryCreateDataFactory.create({ name: '   ' });

      // Act & Assert
      await expect(useCase.execute(inputData)).rejects.toThrow(
        'Category name is required',
      );
      expect(categoryRepositoryStub.getCount()).toBe(0);
    });

    it('should throw error for missing type', async () => {
      // Arrange
      const inputData = MockCategoryCreateDataFactory.create({
        type: undefined as any,
      });

      // Act & Assert
      await expect(useCase.execute(inputData)).rejects.toThrow(
        'Category type is required',
      );
      expect(categoryRepositoryStub.getCount()).toBe(0);
    });

    it('should throw error for missing userId', async () => {
      // Arrange
      const inputData = MockCategoryCreateDataFactory.create({ userId: '' });

      // Act & Assert
      await expect(useCase.execute(inputData)).rejects.toThrow(
        'User ID is required',
      );
      expect(categoryRepositoryStub.getCount()).toBe(0);
    });

    it('should throw error for name too long', async () => {
      // Arrange
      const longName = 'a'.repeat(101);
      const inputData = MockCategoryCreateDataFactory.create({
        name: longName,
      });

      // Act & Assert
      await expect(useCase.execute(inputData)).rejects.toThrow(
        'Category name must be 100 characters or less',
      );
      expect(categoryRepositoryStub.getCount()).toBe(0);
    });

    it('should throw error for description too long', async () => {
      // Arrange
      const longDescription = 'a'.repeat(256);
      const inputData = MockCategoryCreateDataFactory.create({
        description: longDescription,
      });

      // Act & Assert
      await expect(useCase.execute(inputData)).rejects.toThrow(
        'Category description must be 255 characters or less',
      );
      expect(categoryRepositoryStub.getCount()).toBe(0);
    });

    it('should throw error for duplicate category name', async () => {
      // Arrange
      const existingCategory = MockCategoryFactory.create();
      categoryRepositoryStub.seed([existingCategory]);

      const inputData = MockCategoryCreateDataFactory.create({
        name: existingCategory.name,
        userId: existingCategory.userId,
      });

      // Act & Assert
      await expect(useCase.execute(inputData)).rejects.toThrow(
        'Category name already exists for this user',
      );
      expect(categoryRepositoryStub.getCount()).toBe(1); // Only the seeded category
    });

    it('should allow same name for different users', async () => {
      // Arrange
      const existingCategory = MockCategoryFactory.create();
      categoryRepositoryStub.seed([existingCategory]);

      const inputData = MockCategoryCreateDataFactory.create({
        name: existingCategory.name,
        userId: 'different-user-id',
      });

      // Act
      const result = await useCase.execute(inputData);

      // Assert
      expect(result.name).toBe(existingCategory.name);
      expect(result.userId).toBe('different-user-id');
      expect(categoryRepositoryStub.getCount()).toBe(2);
    });

    it('should handle repository errors', async () => {
      // Arrange
      const inputData = MockCategoryCreateDataFactory.createValid();
      categoryRepositoryStub.mockFailure(
        new Error('Database connection failed'),
      );

      // Act & Assert
      await expect(useCase.execute(inputData)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle repository duplicate name error', async () => {
      // Arrange
      const inputData = MockCategoryCreateDataFactory.createValid();
      categoryRepositoryStub.mockFailure(
        new Error('Category name already exists'),
      );

      // Act & Assert
      await expect(useCase.execute(inputData)).rejects.toThrow(
        'Category name already exists',
      );
    });
  });
});
