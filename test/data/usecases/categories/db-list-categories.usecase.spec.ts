import { DbListCategoriesUseCase } from '@data/usecases';
import { CategoryRepositoryStub } from '@test/data/mocks/repositories';
import { MockCategoryFactory } from '@test/domain/mocks/models';
import { CategoryType } from '@domain/models/category.model';
import type { LoggerStub } from '@test/data/mocks/protocols';

describe('DbListCategoriesUseCase', () => {
  let useCase: DbListCategoriesUseCase;
  let repositoryStub: CategoryRepositoryStub;
  let loggerStub: LoggerStub;

  beforeEach(() => {
    repositoryStub = new CategoryRepositoryStub();
    useCase = new DbListCategoriesUseCase(repositoryStub, loggerStub);
  });

  afterEach(() => {
    repositoryStub.clear();
  });

  describe('execute', () => {
    it('should list categories with valid userId', async () => {
      const userId = 'user-a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const categories = [
        MockCategoryFactory.create({ type: CategoryType.INCOME }),
        MockCategoryFactory.create({
          type: CategoryType.EXPENSE,
          name: 'Housing',
        }),
      ];

      repositoryStub.seed(categories, userId);

      const filters = { userId };

      const result = await useCase.execute(filters);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('summary');
      expect(result.data).toHaveLength(2);
      expect(result.summary).toEqual({
        total: 2,
        income: 1,
        expense: 1,
      });
    });

    it('should list categories filtered by type', async () => {
      const userId = 'user-a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const categories = [
        MockCategoryFactory.create({ type: CategoryType.INCOME }),
        MockCategoryFactory.create({ type: CategoryType.EXPENSE }),
      ];

      repositoryStub.seed(categories, userId);

      const filters = { userId, type: CategoryType.INCOME };

      const result = await useCase.execute(filters);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].type).toBe(CategoryType.INCOME);
      expect(result.summary).toEqual({
        total: 1,
        income: 1,
        expense: 0,
      });
    });

    it('should include statistics when requested', async () => {
      const userId = 'user-a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const categoryWithStats = MockCategoryFactory.createWithStats();

      repositoryStub.seed([categoryWithStats], userId);

      const filters = { userId, includeStats: true };

      const result = await useCase.execute(filters);

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toHaveProperty('entriesCount');
      expect(result.data[0]).toHaveProperty('totalAmount');
      expect(result.data[0]).toHaveProperty('lastUsed');
    });

    it('should return empty list when no categories found', async () => {
      const userId = 'user-a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const filters = { userId };

      const result = await useCase.execute(filters);

      expect(result.data).toHaveLength(0);
      expect(result.summary).toEqual({
        total: 0,
        income: 0,
        expense: 0,
      });
    });

    it('should calculate summary correctly with mixed categories', async () => {
      const userId = 'user-a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const categories = [
        MockCategoryFactory.create({
          type: CategoryType.INCOME,
        }),
        MockCategoryFactory.create({
          type: CategoryType.INCOME,
        }),
        MockCategoryFactory.create({
          type: CategoryType.EXPENSE,
        }),
        MockCategoryFactory.create({
          type: CategoryType.EXPENSE,
        }),
        MockCategoryFactory.create({
          type: CategoryType.EXPENSE,
        }),
      ];

      repositoryStub.seed(categories, userId);

      const filters = { userId };

      const result = await useCase.execute(filters);

      expect(result.data).toHaveLength(5);
      expect(result.summary).toEqual({
        total: 5,
        income: 2,
        expense: 3,
      });
    });

    it('should throw error when userId is missing', async () => {
      const filters = { userId: '' };

      await expect(useCase.execute(filters)).rejects.toThrow(
        'User ID is required',
      );
      expect(repositoryStub.getCount()).toBe(0);
    });

    it('should throw error when userId is null', async () => {
      const filters = { userId: null as any };

      await expect(useCase.execute(filters)).rejects.toThrow(
        'User ID is required',
      );
      expect(repositoryStub.getCount()).toBe(0);
    });

    it('should handle repository errors', async () => {
      const userId = 'user-a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const filters = { userId };
      repositoryStub.mockFailure(new Error('Database connection failed'));

      await expect(useCase.execute(filters)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle all type filter', async () => {
      const userId = 'user-a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const categories = [
        MockCategoryFactory.create({ type: CategoryType.INCOME }),
        MockCategoryFactory.create({ type: CategoryType.EXPENSE }),
      ];

      repositoryStub.seed(categories, userId);

      const filters = { userId, type: 'all' as any };

      const result = await useCase.execute(filters);

      expect(result.data).toHaveLength(2);
      expect(result.summary.total).toBe(2);
    });
  });
});
