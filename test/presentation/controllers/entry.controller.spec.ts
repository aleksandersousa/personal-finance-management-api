import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";
import { EntryController } from "../../../src/presentation/controllers/entry.controller";
import { DbAddEntryUseCase } from "../../../src/data/usecases/db-add-entry.usecase";
import { DbListEntriesByMonthUseCase } from "../../../src/data/usecases/db-list-entries-by-month.usecase";
import { CreateEntryDto } from "../../../src/presentation/dtos/create-entry.dto";

describe("EntryController", () => {
  let controller: EntryController;
  let mockAddEntryUseCase: jest.Mocked<DbAddEntryUseCase>;
  let mockListEntriesByMonthUseCase: jest.Mocked<DbListEntriesByMonthUseCase>;

  beforeEach(async () => {
    mockAddEntryUseCase = {
      execute: jest.fn(),
    } as any;

    mockListEntriesByMonthUseCase = {
      execute: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EntryController],
      providers: [
        {
          provide: DbAddEntryUseCase,
          useValue: mockAddEntryUseCase,
        },
        {
          provide: "ListEntriesByMonthUseCase",
          useValue: mockListEntriesByMonthUseCase,
        },
      ],
    }).compile();

    controller = module.get<EntryController>(EntryController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("create", () => {
    it("should create an entry successfully", async () => {
      const createEntryDto: CreateEntryDto = {
        amount: 1000.0,
        description: "Salary",
        type: "INCOME",
        isFixed: true,
        categoryId: "category-id",
        date: "2024-01-15",
      };

      const mockUser = { id: "user-id", email: "user@example.com" };

      const mockResponse = {
        id: "entry-id",
        amount: 1000.0,
        description: "Salary",
        type: "INCOME" as any,
        isFixed: true,
        categoryId: "category-id",
        userId: "user-id",
        date: new Date("2024-01-15"),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAddEntryUseCase.execute.mockResolvedValue(mockResponse);

      const result = await controller.create(createEntryDto, mockUser);

      expect(result).toEqual({
        id: mockResponse.id,
        amount: mockResponse.amount,
        description: mockResponse.description,
        type: mockResponse.type,
        isFixed: mockResponse.isFixed,
        categoryId: mockResponse.categoryId,
        categoryName: "Category Name",
        userId: mockResponse.userId,
        date: mockResponse.date,
        createdAt: mockResponse.createdAt,
        updatedAt: mockResponse.updatedAt,
      });

      expect(mockAddEntryUseCase.execute).toHaveBeenCalledWith({
        userId: mockUser.id,
        description: createEntryDto.description,
        amount: createEntryDto.amount,
        date: new Date(createEntryDto.date),
        type: createEntryDto.type,
        isFixed: createEntryDto.isFixed,
        categoryId: createEntryDto.categoryId,
      });
    });

    it("should throw BadRequestException when entry creation fails", async () => {
      const createEntryDto: CreateEntryDto = {
        amount: 1000.0,
        description: "Salary",
        type: "INCOME",
        isFixed: true,
        categoryId: "category-id",
        date: "2024-01-15",
      };

      const mockUser = { id: "user-id", email: "user@example.com" };

      mockAddEntryUseCase.execute.mockRejectedValue(
        new Error("Invalid category")
      );

      await expect(controller.create(createEntryDto, mockUser)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe("listByMonth", () => {
    it("should return entries for a specific month with pagination and summary", async () => {
      const month = "2024-01";
      const mockUser = { id: "user-id", email: "user@example.com" };

      const mockEntries = [
        {
          id: "entry-1",
          amount: 1000.0,
          description: "Salary",
          type: "INCOME" as any,
          isFixed: true,
          categoryId: "category-1",
          userId: "user-id",
          date: new Date("2024-01-15"),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockUseCaseResponse = {
        data: mockEntries,
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
        summary: {
          totalIncome: 1000.0,
          totalExpenses: 0,
          balance: 1000.0,
          entriesCount: 1,
        },
      };

      mockListEntriesByMonthUseCase.execute.mockResolvedValue(
        mockUseCaseResponse
      );

      const result = await controller.listByMonth(
        month,
        "1",
        "20",
        "date",
        "desc",
        "all",
        "all",
        mockUser
      );

      expect(result.data).toHaveLength(1);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      });
      expect(result.summary).toEqual({
        totalIncome: 1000.0,
        totalExpenses: 0,
        balance: 1000.0,
        entriesCount: 1,
      });

      expect(mockListEntriesByMonthUseCase.execute).toHaveBeenCalledWith({
        userId: mockUser.id,
        year: 2024,
        month: 1,
        page: 1,
        limit: 20,
        sort: "date",
        order: "desc",
        type: "all",
        categoryId: undefined,
      });
    });

    it("should apply custom pagination and filters", async () => {
      const month = "2024-01";
      const mockUser = { id: "user-id", email: "user@example.com" };

      const mockUseCaseResponse = {
        data: [],
        pagination: {
          page: 2,
          limit: 10,
          total: 15,
          totalPages: 2,
          hasNext: false,
          hasPrev: true,
        },
        summary: {
          totalIncome: 5000.0,
          totalExpenses: 2000.0,
          balance: 3000.0,
          entriesCount: 15,
        },
      };

      mockListEntriesByMonthUseCase.execute.mockResolvedValue(
        mockUseCaseResponse
      );

      const result = await controller.listByMonth(
        month,
        "2", // page
        "10", // limit
        "amount", // sort
        "asc", // order
        "INCOME", // type
        "category-123", // category
        mockUser
      );

      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit).toBe(10);

      expect(mockListEntriesByMonthUseCase.execute).toHaveBeenCalledWith({
        userId: mockUser.id,
        year: 2024,
        month: 1,
        page: 2,
        limit: 10,
        sort: "amount",
        order: "asc",
        type: "INCOME",
        categoryId: "category-123",
      });
    });

    it("should validate and sanitize query parameters", async () => {
      const month = "2024-01";
      const mockUser = { id: "user-id", email: "user@example.com" };

      const mockUseCaseResponse = {
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
        summary: {
          totalIncome: 0,
          totalExpenses: 0,
          balance: 0,
          entriesCount: 0,
        },
      };

      mockListEntriesByMonthUseCase.execute.mockResolvedValue(
        mockUseCaseResponse
      );

      await controller.listByMonth(
        month,
        "-1", // Should be corrected to 1
        "200", // Should be corrected to 100 (max)
        "date",
        "desc",
        "all",
        "all",
        mockUser
      );

      expect(mockListEntriesByMonthUseCase.execute).toHaveBeenCalledWith({
        userId: mockUser.id,
        year: 2024,
        month: 1,
        page: 1, // Corrected
        limit: 100, // Corrected
        sort: "date",
        order: "desc",
        type: "all",
        categoryId: undefined,
      });
    });

    it("should throw BadRequestException for invalid sort field", async () => {
      const month = "2024-01";
      const mockUser = { id: "user-id", email: "user@example.com" };

      await expect(
        controller.listByMonth(
          month,
          "1",
          "20",
          "invalid_field", // Invalid sort field
          "desc",
          "all",
          "all",
          mockUser
        )
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException for invalid order", async () => {
      const month = "2024-01";
      const mockUser = { id: "user-id", email: "user@example.com" };

      await expect(
        controller.listByMonth(
          month,
          "1",
          "20",
          "date",
          "invalid_order", // Invalid order
          "all",
          "all",
          mockUser
        )
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException for invalid type", async () => {
      const month = "2024-01";
      const mockUser = { id: "user-id", email: "user@example.com" };

      await expect(
        controller.listByMonth(
          month,
          "1",
          "20",
          "date",
          "desc",
          "INVALID_TYPE", // Invalid type
          "all",
          mockUser
        )
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException for invalid month format", async () => {
      const month = "invalid-month";
      const mockUser = { id: "user-id", email: "user@example.com" };

      await expect(
        controller.listByMonth(
          month,
          "1",
          "20",
          "date",
          "desc",
          "all",
          "all",
          mockUser
        )
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException for invalid year or month values", async () => {
      const month = "1899-13"; // Invalid year and month
      const mockUser = { id: "user-id", email: "user@example.com" };

      await expect(
        controller.listByMonth(
          month,
          "1",
          "20",
          "date",
          "desc",
          "all",
          "all",
          mockUser
        )
      ).rejects.toThrow(BadRequestException);
    });
  });
});
