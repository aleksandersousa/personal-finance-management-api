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
    it("should return entries for a specific month", async () => {
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

      mockListEntriesByMonthUseCase.execute.mockResolvedValue(mockEntries);

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
      expect(result.summary.totalIncome).toBe(1000.0);
      expect(result.summary.totalExpenses).toBe(0);
      expect(result.summary.balance).toBe(1000.0);
      expect(result.summary.entriesCount).toBe(1);

      expect(mockListEntriesByMonthUseCase.execute).toHaveBeenCalledWith({
        userId: mockUser.id,
        year: 2024,
        month: 1,
      });
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
  });
});
