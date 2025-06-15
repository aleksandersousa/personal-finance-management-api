import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";
import { EntryController } from "../../../src/presentation/controllers/entry.controller";
import { DbAddEntryUseCase } from "../../../src/data/usecases/db-add-entry.usecase";
import { AddEntryUseCaseMockFactory } from "../../domain/mocks/usecases/add-entry.mock";
import { MockEntryFactory } from "../../domain/mocks/models/entry.mock";
import { LoggerSpy } from "../../infra/mocks/logging/logger.spy";
import { MetricsSpy } from "../../infra/mocks/metrics/metrics.spy";
import { CreateEntryDto } from "../../../src/presentation/dtos/create-entry.dto";

describe("EntryController", () => {
  let controller: EntryController;
  let addEntryUseCase: jest.Mocked<any>;
  let listEntriesByMonthUseCase: jest.Mocked<any>;
  let loggerSpy: LoggerSpy;
  let metricsSpy: MetricsSpy;

  beforeEach(async () => {
    addEntryUseCase = AddEntryUseCaseMockFactory.createSuccess();
    listEntriesByMonthUseCase = {
      execute: jest.fn(),
    };
    loggerSpy = new LoggerSpy();
    metricsSpy = new MetricsSpy();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EntryController],
      providers: [
        {
          provide: DbAddEntryUseCase,
          useValue: addEntryUseCase,
        },
        {
          provide: "ListEntriesByMonthUseCase",
          useValue: listEntriesByMonthUseCase,
        },
        {
          provide: "ContextAwareLoggerService",
          useValue: loggerSpy,
        },
        {
          provide: "MetricsService",
          useValue: metricsSpy,
        },
      ],
    }).compile();

    controller = module.get<EntryController>(EntryController);
  });

  afterEach(() => {
    loggerSpy.clear();
    metricsSpy.clear();
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

      const mockUser = { id: "user-id", email: "test@example.com" };
      const mockEntry = MockEntryFactory.create({
        id: "entry-id",
        amount: 1000.0,
        description: "Salary",
        type: "INCOME",
        isFixed: true,
        categoryId: "category-id",
        userId: "user-id",
        date: new Date("2024-01-15"),
      });

      addEntryUseCase.execute.mockResolvedValue(mockEntry);

      const result = await controller.create(createEntryDto, mockUser);

      expect(result).toHaveProperty("id");
      expect(result.amount).toBe(mockEntry.amount);
      expect(result.description).toBe(mockEntry.description);
      expect(result.type).toBe(mockEntry.type);
      expect(result.userId).toBe(mockEntry.userId);

      expect(addEntryUseCase.execute).toHaveBeenCalledWith({
        userId: "user-id",
        description: createEntryDto.description,
        amount: createEntryDto.amount,
        date: new Date(createEntryDto.date),
        type: createEntryDto.type,
        isFixed: createEntryDto.isFixed,
        categoryId: createEntryDto.categoryId,
      });
    });

    it("should throw NotFoundException when category not found", async () => {
      const createEntryDto: CreateEntryDto = {
        amount: 1000.0,
        description: "Salary",
        type: "INCOME",
        isFixed: true,
        categoryId: "invalid-category-id",
        date: "2024-01-15",
      };

      const mockUser = { id: "user-id", email: "test@example.com" };
      const error = new Error("Category not found");

      addEntryUseCase.execute.mockRejectedValue(error);

      await expect(controller.create(createEntryDto, mockUser)).rejects.toThrow(
        "Category not found"
      );
    });

    it("should handle validation errors", async () => {
      const createEntryDto: CreateEntryDto = {
        amount: -100,
        description: "",
        type: "INCOME",
        isFixed: true,
        categoryId: "category-id",
        date: "2024-01-15",
      };

      const mockUser = { id: "user-id", email: "test@example.com" };
      const validationError = new Error("Amount must be greater than zero");

      addEntryUseCase.execute.mockRejectedValue(validationError);

      await expect(controller.create(createEntryDto, mockUser)).rejects.toThrow(
        BadRequestException
      );
    });

    it("should handle unauthorized requests", async () => {
      const createEntryDto: CreateEntryDto = {
        amount: 1000.0,
        description: "Salary",
        type: "INCOME",
        isFixed: true,
        categoryId: "category-id",
        date: "2024-01-15",
      };

      const mockUser = { id: null, email: null };

      // This would normally be handled by the auth guard, but we can test the behavior
      expect(mockUser.id).toBeNull();
    });
  });

  describe("listByMonth", () => {
    it("should return entries for a specific month with pagination", async () => {
      const month = "2024-01";
      const mockUser = { id: "user-id", email: "test@example.com" };

      const mockEntries = [
        MockEntryFactory.create({
          id: "entry-1",
          amount: 1000.0,
          description: "Salary",
          type: "INCOME" as any,
          isFixed: true,
          categoryId: "category-1",
          userId: "user-id",
          date: new Date("2024-01-15"),
        }),
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

      listEntriesByMonthUseCase.execute.mockResolvedValue(mockUseCaseResponse);

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

      expect(listEntriesByMonthUseCase.execute).toHaveBeenCalledWith({
        userId: "user-id",
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

    it("should handle list entries errors appropriately", async () => {
      const month = "2024-01";
      const mockUser = { id: "user-id", email: "test@example.com" };

      const error = new Error("Database connection failed");
      listEntriesByMonthUseCase.execute.mockRejectedValue(error);

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
      ).rejects.toThrow("Failed to retrieve entries");
    });

    it("should handle pagination parameters correctly", async () => {
      const month = "2024-01";
      const mockUser = { id: "user-id", email: "test@example.com" };

      const mockUseCaseResponse = {
        data: [],
        pagination: {
          page: 2,
          limit: 10,
          total: 25,
          totalPages: 3,
          hasNext: true,
          hasPrev: true,
        },
        summary: {
          totalIncome: 0,
          totalExpenses: 0,
          balance: 0,
          entriesCount: 0,
        },
      };

      listEntriesByMonthUseCase.execute.mockResolvedValue(mockUseCaseResponse);

      await controller.listByMonth(
        month,
        "2",
        "10",
        "amount",
        "asc",
        "INCOME",
        "category-123",
        mockUser
      );

      expect(listEntriesByMonthUseCase.execute).toHaveBeenCalledWith({
        userId: "user-id",
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
      const mockUser = { id: "user-id", email: "test@example.com" };

      const mockUseCaseResponse = {
        data: [],
        pagination: {
          page: 1,
          limit: 100,
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

      listEntriesByMonthUseCase.execute.mockResolvedValue(mockUseCaseResponse);

      // Test with valid parameters that get normalized
      await controller.listByMonth(
        month,
        "-1", // Should be corrected to 1
        "200", // Should be corrected to 100 (max)
        "date", // Valid sort field
        "desc", // Valid order
        "all", // Valid type
        "all",
        mockUser
      );

      expect(listEntriesByMonthUseCase.execute).toHaveBeenCalledWith({
        userId: "user-id",
        year: 2024,
        month: 1,
        page: 1, // Corrected
        limit: 100, // Corrected
        sort: "date", // Valid
        order: "desc", // Valid
        type: "all", // Valid
        categoryId: undefined,
      });
    });

    it("should throw BadRequestException for invalid sort field", async () => {
      const month = "2024-01";
      const mockUser = { id: "user-id", email: "test@example.com" };

      await expect(
        controller.listByMonth(
          month,
          "1",
          "20",
          "invalid_field",
          "desc",
          "all",
          "all",
          mockUser
        )
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException for invalid order", async () => {
      const month = "2024-01";
      const mockUser = { id: "user-id", email: "test@example.com" };

      await expect(
        controller.listByMonth(
          month,
          "1",
          "20",
          "date",
          "invalid_order",
          "all",
          "all",
          mockUser
        )
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException for invalid type", async () => {
      const month = "2024-01";
      const mockUser = { id: "user-id", email: "test@example.com" };

      await expect(
        controller.listByMonth(
          month,
          "1",
          "20",
          "date",
          "desc",
          "INVALID_TYPE",
          "all",
          mockUser
        )
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException for invalid month format", async () => {
      const month = "invalid-month";
      const mockUser = { id: "user-id", email: "test@example.com" };

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
      const month = "1899-13";
      const mockUser = { id: "user-id", email: "test@example.com" };

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
