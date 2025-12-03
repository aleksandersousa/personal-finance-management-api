import { DbListCategoriesUseCase } from '@data/usecases';
import { CategoryRepositoryStub } from '@test/data/mocks/repositories';
import { MockCategoryFactory } from '@test/domain/mocks/models';
import { CategoryType } from '@domain/models/category.model';

describe('DbListCategoriesUseCase', () => {
  let useCase: DbListCategoriesUseCase;
  let repositoryStub: CategoryRepositoryStub;

  beforeEach(() => {
    repositoryStub = new CategoryRepositoryStub();
    useCase = new DbListCategoriesUseCase(repositoryStub);
  });

  afterEach(() => {
    repositoryStub.clear();
  });

  describe('execute', () => {
    it('should list categories with valid userId', async () => {
      // Arrange
      const userId = 'user-a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const categories = [
        MockCategoryFactory.create({ userId, type: CategoryType.INCOME }),
        MockCategoryFactory.create({
          userId,
          type: CategoryType.EXPENSE,
          name: 'Housing',
          isDefault: true,
        }),
      ];

      repositoryStub.seed(categories);

      const filters = { userId };

      // Act
      const result = await useCase.execute(filters);

      // Assert
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('summary');
      expect(result.data).toHaveLength(2);
      expect(result.summary).toEqual({
        total: 2,
        income: 1,
        expense: 1,
        custom: 1,
        default: 1,
      });
    });

    it('should list categories filtered by type', async () => {
      // Arrange
      const userId = 'user-a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const categories = [
        MockCategoryFactory.create({ userId, type: CategoryType.INCOME }),
        MockCategoryFactory.create({ userId, type: CategoryType.EXPENSE }),
      ];

      repositoryStub.seed(categories);

      const filters = { userId, type: CategoryType.INCOME };

      // Act
      const result = await useCase.execute(filters);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].type).toBe(CategoryType.INCOME);
      expect(result.summary).toEqual({
        total: 1,
        income: 1,
        expense: 0,
        custom: 1,
        default: 0,
      });
    });

    it('should include statistics when requested', async () => {
      // Arrange
      const userId = 'user-a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const categoryWithStats = MockCategoryFactory.createWithStats({ userId });

      repositoryStub.seed([categoryWithStats]);

      const filters = { userId, includeStats: true };

      // Act
      const result = await useCase.execute(filters);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toHaveProperty('entriesCount');
      expect(result.data[0]).toHaveProperty('totalAmount');
      expect(result.data[0]).toHaveProperty('lastUsed');
    });

    it('should return empty list when no categories found', async () => {
      // Arrange
      const userId = 'user-a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const filters = { userId };

      // Act
      const result = await useCase.execute(filters);

      // Assert
      expect(result.data).toHaveLength(0);
      expect(result.summary).toEqual({
        total: 0,
        income: 0,
        expense: 0,
        custom: 0,
        default: 0,
      });
    });

    it('should calculate summary correctly with mixed categories', async () => {
      // Arrange
      const userId = 'user-a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const categories = [
        MockCategoryFactory.create({
          userId,
          type: CategoryType.INCOME,
          isDefault: true,
        }),
        MockCategoryFactory.create({
          userId,
          type: CategoryType.INCOME,
          isDefault: false,
        }),
        MockCategoryFactory.create({
          userId,
          type: CategoryType.EXPENSE,
          isDefault: true,
        }),
        MockCategoryFactory.create({
          userId,
          type: CategoryType.EXPENSE,
          isDefault: false,
        }),
        MockCategoryFactory.create({
          userId,
          type: CategoryType.EXPENSE,
          isDefault: false,
        }),
      ];

      repositoryStub.seed(categories);

      const filters = { userId };

      // Act
      const result = await useCase.execute(filters);

      // Assert
      expect(result.data).toHaveLength(5);
      expect(result.summary).toEqual({
        total: 5,
        income: 2,
        expense: 3,
        custom: 3,
        default: 2,
      });
    });

    it('should throw error when userId is missing', async () => {
      // Arrange
      const filters = { userId: '' };

      // Act & Assert
      await expect(useCase.execute(filters)).rejects.toThrow(
        'User ID is required',
      );
      expect(repositoryStub.getCount()).toBe(0);
    });

    it('should throw error when userId is null', async () => {
      // Arrange
      const filters = { userId: null as any };

      // Act & Assert
      await expect(useCase.execute(filters)).rejects.toThrow(
        'User ID is required',
      );
      expect(repositoryStub.getCount()).toBe(0);
    });

    it('should handle repository errors', async () => {
      // Arrange
      const userId = 'user-a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const filters = { userId };
      repositoryStub.mockFailure(new Error('Database connection failed'));

      // Act & Assert
      await expect(useCase.execute(filters)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle all type filter', async () => {
      // Arrange
      const userId = 'user-a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const categories = [
        MockCategoryFactory.create({ userId, type: CategoryType.INCOME }),
        MockCategoryFactory.create({ userId, type: CategoryType.EXPENSE }),
      ];

      repositoryStub.seed(categories);

      const filters = { userId, type: 'all' as any };

      // Act
      const result = await useCase.execute(filters);

      // Assert
      expect(result.data).toHaveLength(2);
      expect(result.summary.total).toBe(2);
    });
  });
});
