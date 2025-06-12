import { DbAddEntryUseCase } from "@data/usecases/db-add-entry.usecase";
import { EntryRepository } from "@data/protocols/entry-repository";
import { UserRepository } from "@data/protocols/user-repository";
import { CategoryRepository } from "@data/protocols/category-repository";
import { IdGenerator } from "@data/protocols/id-generator";
import { AddEntryRequest } from "@domain/usecases/add-entry.usecase";
import { EntryModel } from "@domain/models/entry.model";
import { UserModel } from "@domain/models/user.model";
import { CategoryModel } from "@domain/models/category.model";

describe("DbAddEntryUseCase", () => {
  let sut: DbAddEntryUseCase;
  let entryRepository: jest.Mocked<EntryRepository>;
  let userRepository: jest.Mocked<UserRepository>;
  let categoryRepository: jest.Mocked<CategoryRepository>;
  let idGenerator: jest.Mocked<IdGenerator>;

  beforeEach(() => {
    entryRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findByUserIdAndMonth: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    userRepository = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
    };

    categoryRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findByUserIdAndType: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    idGenerator = {
      generate: jest.fn(),
    };

    sut = new DbAddEntryUseCase(
      entryRepository,
      userRepository,
      categoryRepository,
      idGenerator
    );
  });

  describe("execute", () => {
    const mockUser: UserModel = {
      id: "valid-user-id",
      name: "John Doe",
      email: "john@example.com",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockCategory: CategoryModel = {
      id: "valid-category-id",
      name: "Salary",
      type: "INCOME",
      userId: "valid-user-id",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockRequest: AddEntryRequest = {
      userId: "valid-user-id",
      description: "Salary - January 2025",
      amount: 5000,
      date: new Date("2025-01-15"),
      type: "INCOME",
      isFixed: true,
      categoryId: "valid-category-id",
    };

    const mockEntry: EntryModel = {
      id: "valid-entry-id",
      userId: "valid-user-id",
      description: "Salary - January 2025",
      amount: 5000,
      date: new Date("2025-01-15"),
      type: "INCOME",
      isFixed: true,
      categoryId: "valid-category-id",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("should create an entry successfully", async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(mockUser);
      categoryRepository.findById.mockResolvedValue(mockCategory);
      entryRepository.create.mockResolvedValue(mockEntry);

      // Act
      const result = await sut.execute(mockRequest);

      // Assert
      expect(userRepository.findById).toHaveBeenCalledWith(mockRequest.userId);
      expect(categoryRepository.findById).toHaveBeenCalledWith(
        mockRequest.categoryId
      );
      expect(entryRepository.create).toHaveBeenCalledWith({
        userId: mockRequest.userId,
        description: mockRequest.description,
        amount: mockRequest.amount,
        date: mockRequest.date,
        type: mockRequest.type,
        isFixed: mockRequest.isFixed,
        categoryId: mockRequest.categoryId,
      });
      expect(result).toEqual(mockEntry);
    });

    it("should throw error if user not found", async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(sut.execute(mockRequest)).rejects.toThrow("User not found");
      expect(entryRepository.create).not.toHaveBeenCalled();
    });

    it("should throw error if category not found", async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(mockUser);
      categoryRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(sut.execute(mockRequest)).rejects.toThrow(
        "Category not found"
      );
      expect(entryRepository.create).not.toHaveBeenCalled();
    });

    it("should throw error if category does not belong to user", async () => {
      // Arrange
      const categoryFromOtherUser = {
        ...mockCategory,
        userId: "other-user-id",
      };
      userRepository.findById.mockResolvedValue(mockUser);
      categoryRepository.findById.mockResolvedValue(categoryFromOtherUser);

      // Act & Assert
      await expect(sut.execute(mockRequest)).rejects.toThrow(
        "Category does not belong to the user"
      );
      expect(entryRepository.create).not.toHaveBeenCalled();
    });

    it("should throw error if amount is zero", async () => {
      // Arrange
      const invalidRequest = { ...mockRequest, amount: 0 };

      // Act & Assert
      await expect(sut.execute(invalidRequest)).rejects.toThrow(
        "Amount must be greater than zero"
      );
      expect(entryRepository.create).not.toHaveBeenCalled();
    });

    it("should throw error if amount is negative", async () => {
      // Arrange
      const invalidRequest = { ...mockRequest, amount: -100 };

      // Act & Assert
      await expect(sut.execute(invalidRequest)).rejects.toThrow(
        "Amount must be greater than zero"
      );
      expect(entryRepository.create).not.toHaveBeenCalled();
    });

    it("should throw error if description is empty", async () => {
      // Arrange
      const invalidRequest = { ...mockRequest, description: "" };

      // Act & Assert
      await expect(sut.execute(invalidRequest)).rejects.toThrow(
        "Description is required"
      );
      expect(entryRepository.create).not.toHaveBeenCalled();
    });

    it("should throw error if description is only whitespace", async () => {
      // Arrange
      const invalidRequest = { ...mockRequest, description: "   " };

      // Act & Assert
      await expect(sut.execute(invalidRequest)).rejects.toThrow(
        "Description is required"
      );
      expect(entryRepository.create).not.toHaveBeenCalled();
    });

    it("should throw error if userId is empty", async () => {
      // Arrange
      const invalidRequest = { ...mockRequest, userId: "" };

      // Act & Assert
      await expect(sut.execute(invalidRequest)).rejects.toThrow(
        "User ID is required"
      );
      expect(entryRepository.create).not.toHaveBeenCalled();
    });

    it("should trim description before saving", async () => {
      // Arrange
      const requestWithSpaces = {
        ...mockRequest,
        description: "  Salary - January 2025  ",
      };
      userRepository.findById.mockResolvedValue(mockUser);
      categoryRepository.findById.mockResolvedValue(mockCategory);
      entryRepository.create.mockResolvedValue(mockEntry);

      // Act
      await sut.execute(requestWithSpaces);

      // Assert
      expect(entryRepository.create).toHaveBeenCalledWith({
        userId: mockRequest.userId,
        description: "Salary - January 2025",
        amount: mockRequest.amount,
        date: mockRequest.date,
        type: mockRequest.type,
        isFixed: mockRequest.isFixed,
        categoryId: mockRequest.categoryId,
      });
    });

    it("should work without categoryId", async () => {
      // Arrange
      const requestWithoutCategory = { ...mockRequest };
      delete requestWithoutCategory.categoryId;
      userRepository.findById.mockResolvedValue(mockUser);
      entryRepository.create.mockResolvedValue(mockEntry);

      // Act
      await sut.execute(requestWithoutCategory);

      // Assert
      expect(userRepository.findById).toHaveBeenCalledWith(mockRequest.userId);
      expect(categoryRepository.findById).not.toHaveBeenCalled();
      expect(entryRepository.create).toHaveBeenCalledWith({
        userId: mockRequest.userId,
        description: mockRequest.description,
        amount: mockRequest.amount,
        date: mockRequest.date,
        type: mockRequest.type,
        isFixed: mockRequest.isFixed,
        categoryId: undefined,
      });
    });
  });
});
