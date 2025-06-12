import { DbListEntriesByMonthUseCase } from "@data/usecases/db-list-entries-by-month.usecase";
import { EntryRepository } from "@data/protocols/entry-repository";
import { UserRepository } from "@data/protocols/user-repository";
import { EntryModel } from "@domain/models/entry.model";
import { UserModel } from "@domain/models/user.model";

describe("DbListEntriesByMonthUseCase", () => {
  let sut: DbListEntriesByMonthUseCase;
  let mockEntryRepository: jest.Mocked<EntryRepository>;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockEntryRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findByUserIdAndMonth: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    mockUserRepository = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
    };

    sut = new DbListEntriesByMonthUseCase(
      mockEntryRepository,
      mockUserRepository
    );
  });

  describe("execute", () => {
    const mockUser: UserModel = {
      id: "user-123",
      name: "Test User",
      email: "test@example.com",
      password: "hashed-password",
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockEntries: EntryModel[] = [
      {
        id: "entry-1",
        userId: "user-123",
        description: "Salary",
        amount: 5000,
        date: new Date("2025-01-15"),
        type: "INCOME",
        isFixed: true,
        categoryId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "entry-2",
        userId: "user-123",
        description: "Grocery shopping",
        amount: 200,
        date: new Date("2025-01-10"),
        type: "EXPENSE",
        isFixed: false,
        categoryId: "category-123",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it("should list entries for a valid month successfully", async () => {
      const request = {
        userId: "user-123",
        year: 2025,
        month: 1,
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockEntryRepository.findByUserIdAndMonth.mockResolvedValue(mockEntries);

      const result = await sut.execute(request);

      expect(result).toEqual(mockEntries);
      expect(mockUserRepository.findById).toHaveBeenCalledWith("user-123");
      expect(mockEntryRepository.findByUserIdAndMonth).toHaveBeenCalledWith(
        "user-123",
        2025,
        1
      );
    });

    it("should return empty array when no entries found for the month", async () => {
      const request = {
        userId: "user-123",
        year: 2025,
        month: 2,
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockEntryRepository.findByUserIdAndMonth.mockResolvedValue([]);

      const result = await sut.execute(request);

      expect(result).toEqual([]);
      expect(mockUserRepository.findById).toHaveBeenCalledWith("user-123");
      expect(mockEntryRepository.findByUserIdAndMonth).toHaveBeenCalledWith(
        "user-123",
        2025,
        2
      );
    });

    it("should throw error if user ID is not provided", async () => {
      const request = {
        userId: "",
        year: 2025,
        month: 1,
      };

      await expect(sut.execute(request)).rejects.toThrow("User ID is required");
    });

    it("should throw error if year is invalid", async () => {
      const request = {
        userId: "user-123",
        year: 1899,
        month: 1,
      };

      await expect(sut.execute(request)).rejects.toThrow("Invalid year");
    });

    it("should throw error if month is invalid", async () => {
      const request = {
        userId: "user-123",
        year: 2025,
        month: 13,
      };

      await expect(sut.execute(request)).rejects.toThrow("Invalid month");
    });

    it("should throw error if user is not found", async () => {
      const request = {
        userId: "user-123",
        year: 2025,
        month: 1,
      };

      mockUserRepository.findById.mockResolvedValue(null);

      await expect(sut.execute(request)).rejects.toThrow("User not found");
      expect(mockUserRepository.findById).toHaveBeenCalledWith("user-123");
    });
  });
});
