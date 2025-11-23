import { DbAddEntryUseCase } from '@data/usecases/db-add-entry.usecase';
import { EntryRepositoryStub } from '../mocks/repositories/entry-repository.stub';
import { UserRepositoryStub } from '../mocks/repositories/user-repository.stub';
import { CategoryRepositoryStub } from '../mocks/repositories/category-repository.stub';
import { IdGeneratorStub } from '../mocks/protocols/id-generator.stub';
import { MockEntryFactory } from '../../domain/mocks/models/entry.mock';
import { MockUserFactory } from '../../domain/mocks/models/user.mock';
import { MockCategoryFactory } from '../../domain/mocks/models/category.mock';
import { CategoryType } from '@domain/models/category.model';

describe('DbAddEntryUseCase', () => {
  let sut: DbAddEntryUseCase;
  let entryRepositoryStub: EntryRepositoryStub;
  let userRepositoryStub: UserRepositoryStub;
  let categoryRepositoryStub: CategoryRepositoryStub;
  let idGeneratorStub: IdGeneratorStub;

  beforeEach(() => {
    idGeneratorStub = new IdGeneratorStub();
    entryRepositoryStub = new EntryRepositoryStub(idGeneratorStub);
    userRepositoryStub = new UserRepositoryStub();
    categoryRepositoryStub = new CategoryRepositoryStub();

    sut = new DbAddEntryUseCase(
      entryRepositoryStub,
      userRepositoryStub,
      categoryRepositoryStub,
      idGeneratorStub,
    );
  });

  afterEach(() => {
    entryRepositoryStub.clear();
    userRepositoryStub.clear();
    categoryRepositoryStub.clear();
    idGeneratorStub.clear();
  });

  describe('execute', () => {
    const mockUser = MockUserFactory.create({
      id: 'valid-user-id',
      name: 'John Doe',
      email: 'john@example.com',
    });

    const mockCategory = MockCategoryFactory.create({
      id: 'valid-category-id',
      name: 'Salary',
      type: CategoryType.INCOME,
      userId: 'valid-user-id',
    });

    const mockRequest = MockEntryFactory.createAddRequest({
      userId: 'valid-user-id',
      description: 'Salary - January 2025',
      amount: 5000,
      date: new Date('2025-01-15'),
      type: 'INCOME',
      isFixed: true,
      categoryId: 'valid-category-id',
    });

    it('should create an entry successfully', async () => {
      // Arrange
      userRepositoryStub.seed([mockUser]);
      categoryRepositoryStub.seed([mockCategory]);

      // Act
      const result = await sut.execute(mockRequest);

      // Assert
      expect(result).toHaveProperty('id');
      expect(result.description).toBe(mockRequest.description);
      expect(result.amount).toBe(mockRequest.amount);
      expect(result.userId).toBe(mockRequest.userId);
      expect(result.categoryId).toBe(mockRequest.categoryId);

      // Verify repository interactions
      expect(entryRepositoryStub.getCount()).toBe(1);
      expect(userRepositoryStub.hasUser(mockUser.id)).toBe(true);
      expect(categoryRepositoryStub.hasCategory(mockCategory.id)).toBe(true);
    });

    it('should throw error if user not found', async () => {
      // Arrange
      categoryRepositoryStub.seed([mockCategory]);
      // User not seeded - simulates user not found

      // Act & Assert
      await expect(sut.execute(mockRequest)).rejects.toThrow('User not found');
      expect(entryRepositoryStub.getCount()).toBe(0);
    });

    it('should throw error if category not found', async () => {
      // Arrange
      userRepositoryStub.seed([mockUser]);
      // Category not seeded - simulates category not found

      // Act & Assert
      await expect(sut.execute(mockRequest)).rejects.toThrow(
        'Category not found',
      );
      expect(entryRepositoryStub.getCount()).toBe(0);
    });

    it('should throw error if category does not belong to user', async () => {
      // Arrange
      const categoryFromOtherUser = MockCategoryFactory.create({
        id: 'valid-category-id',
        userId: 'other-user-id',
        name: 'Other User Category',
      });

      userRepositoryStub.seed([mockUser]);
      categoryRepositoryStub.seed([categoryFromOtherUser]);

      // Act & Assert
      await expect(sut.execute(mockRequest)).rejects.toThrow(
        'Category does not belong to the user',
      );
      expect(entryRepositoryStub.getCount()).toBe(0);
    });

    it('should throw error if amount is zero', async () => {
      // Arrange
      const invalidRequest = MockEntryFactory.createAddRequest({
        ...mockRequest,
        amount: 0,
      });

      // Act & Assert
      await expect(sut.execute(invalidRequest)).rejects.toThrow(
        'Amount must be greater than zero',
      );
      expect(entryRepositoryStub.getCount()).toBe(0);
    });

    it('should throw error if amount is negative', async () => {
      // Arrange
      const invalidRequest = MockEntryFactory.createAddRequest({
        ...mockRequest,
        amount: -100,
      });

      // Act & Assert
      await expect(sut.execute(invalidRequest)).rejects.toThrow(
        'Amount must be greater than zero',
      );
      expect(entryRepositoryStub.getCount()).toBe(0);
    });

    it('should throw error if description is empty', async () => {
      // Arrange
      const invalidRequest = MockEntryFactory.createAddRequest({
        ...mockRequest,
        description: '',
      });

      // Act & Assert
      await expect(sut.execute(invalidRequest)).rejects.toThrow(
        'Description is required',
      );
      expect(entryRepositoryStub.getCount()).toBe(0);
    });

    it('should throw error if description is only whitespace', async () => {
      // Arrange
      const invalidRequest = MockEntryFactory.createAddRequest({
        ...mockRequest,
        description: '   ',
      });

      // Act & Assert
      await expect(sut.execute(invalidRequest)).rejects.toThrow(
        'Description is required',
      );
      expect(entryRepositoryStub.getCount()).toBe(0);
    });

    it('should throw error if userId is empty', async () => {
      // Arrange
      const invalidRequest = MockEntryFactory.createAddRequest({
        ...mockRequest,
        userId: '',
      });

      // Act & Assert
      await expect(sut.execute(invalidRequest)).rejects.toThrow(
        'User ID is required',
      );
      expect(entryRepositoryStub.getCount()).toBe(0);
    });

    it('should throw error if userId is null', async () => {
      // Arrange
      const invalidRequest = MockEntryFactory.createAddRequest({
        ...mockRequest,
        userId: null as any,
      });

      // Act & Assert
      await expect(sut.execute(invalidRequest)).rejects.toThrow(
        'User ID is required',
      );
      expect(entryRepositoryStub.getCount()).toBe(0);
    });

    it('should handle repository errors', async () => {
      // Arrange
      userRepositoryStub.seed([mockUser]);
      categoryRepositoryStub.seed([mockCategory]);
      entryRepositoryStub.mockConnectionError();

      // Act & Assert
      await expect(sut.execute(mockRequest)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle user repository errors', async () => {
      // Arrange
      userRepositoryStub.mockConnectionError();

      // Act & Assert
      await expect(sut.execute(mockRequest)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle category repository errors', async () => {
      // Arrange
      userRepositoryStub.seed([mockUser]);
      categoryRepositoryStub.mockConnectionError();

      // Act & Assert
      await expect(sut.execute(mockRequest)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should create entry with generated ID', async () => {
      // Arrange
      userRepositoryStub.seed([mockUser]);
      categoryRepositoryStub.seed([mockCategory]);
      idGeneratorStub.setPrefix('test-entry');

      // Act
      const result = await sut.execute(mockRequest);

      // Assert
      expect(result.id).toContain('test-entry');
      expect(entryRepositoryStub.hasEntry(result.id)).toBe(true);
    });

    it('should create multiple entries with different IDs', async () => {
      // Arrange
      userRepositoryStub.seed([mockUser]);
      categoryRepositoryStub.seed([mockCategory]);

      const request1 = MockEntryFactory.createAddRequest({
        ...mockRequest,
        description: 'Entry 1',
      });
      const request2 = MockEntryFactory.createAddRequest({
        ...mockRequest,
        description: 'Entry 2',
      });

      // Act
      const result1 = await sut.execute(request1);
      const result2 = await sut.execute(request2);

      // Assert
      expect(result1.id).not.toBe(result2.id);
      expect(entryRepositoryStub.getCount()).toBe(2);
      expect(entryRepositoryStub.hasEntry(result1.id)).toBe(true);
      expect(entryRepositoryStub.hasEntry(result2.id)).toBe(true);
    });

    it('should create entry with correct timestamps', async () => {
      // Arrange
      userRepositoryStub.seed([mockUser]);
      categoryRepositoryStub.seed([mockCategory]);
      const beforeExecution = new Date();

      // Act
      const result = await sut.execute(mockRequest);

      // Assert
      const afterExecution = new Date();
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(
        beforeExecution.getTime(),
      );
      expect(result.createdAt.getTime()).toBeLessThanOrEqual(
        afterExecution.getTime(),
      );
    });
  });
});
