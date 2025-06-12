import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  ValidationPipe,
  HttpStatus,
  HttpCode,
  UseGuards,
  Req,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  Inject,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { Request } from "express";
import { DbAddEntryUseCase } from "@data/usecases/db-add-entry.usecase";
import { DbListEntriesByMonthUseCase } from "@data/usecases/db-list-entries-by-month.usecase";
import { CreateEntryDto } from "../dtos/create-entry.dto";
import { EntryResponseDto } from "../dtos/entry-response.dto";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
  };
}

@ApiTags("entries")
@Controller("entries")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class EntryController {
  constructor(
    private readonly addEntryUseCase: DbAddEntryUseCase,
    @Inject("ListEntriesByMonthUseCase")
    private readonly listEntriesByMonthUseCase: DbListEntriesByMonthUseCase
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Create a new financial entry",
    description:
      "Creates a new financial entry (income or expense) for the authenticated user. This endpoint implements Story 1: Add fixed income.",
  })
  @ApiResponse({
    status: 201,
    description: "Entry created successfully",
    type: EntryResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Validation failed or invalid data",
    schema: {
      type: "object",
      properties: {
        statusCode: { type: "number", example: 400 },
        message: { type: "array", items: { type: "string" } },
        error: { type: "string", example: "Bad Request" },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing token",
    schema: {
      type: "object",
      properties: {
        statusCode: { type: "number", example: 401 },
        message: { type: "string", example: "Unauthorized" },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "Resource not found",
    schema: {
      type: "object",
      properties: {
        statusCode: { type: "number", example: 404 },
        message: { type: "string", example: "Category not found" },
        error: { type: "string", example: "Not Found" },
      },
    },
  })
  @ApiBody({ type: CreateEntryDto })
  async create(
    @Body(ValidationPipe) createEntryDto: CreateEntryDto,
    @Req() req: AuthenticatedRequest
  ): Promise<EntryResponseDto> {
    try {
      const entry = await this.addEntryUseCase.execute({
        userId: req.user.id,
        description: createEntryDto.description,
        amount: createEntryDto.amount,
        date: new Date(createEntryDto.date),
        type: createEntryDto.type,
        isFixed: createEntryDto.isFixed,
        categoryId: createEntryDto.categoryId,
      });

      return {
        id: entry.id,
        userId: entry.userId,
        description: entry.description,
        amount: entry.amount,
        date: entry.date,
        type: entry.type,
        isFixed: entry.isFixed,
        categoryId: entry.categoryId,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      };
    } catch (error) {
      // Handle specific business logic errors (non-sensitive)
      if (this.isClientError(error.message)) {
        if (this.isNotFoundError(error.message)) {
          throw new NotFoundException(error.message);
        }
        throw new BadRequestException(error.message);
      }

      // Handle sensitive/unexpected errors
      console.error("Unexpected error in EntryController.create:", error);
      throw new InternalServerErrorException(
        "An unexpected error occurred while creating the entry"
      );
    }
  }

  @Get()
  @ApiOperation({
    summary: "List entries for a specific month",
    description:
      "Retrieves all financial entries for the authenticated user for a specific month. This endpoint implements Story 6: List entries by month.",
  })
  @ApiQuery({
    name: "month",
    description: "Month in YYYY-MM format",
    example: "2025-01",
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: "Entries retrieved successfully",
    type: [EntryResponseDto],
  })
  @ApiResponse({
    status: 400,
    description: "Invalid month format or parameters",
    schema: {
      type: "object",
      properties: {
        statusCode: { type: "number", example: 400 },
        message: { type: "string", example: "Invalid month format" },
        error: { type: "string", example: "Bad Request" },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing token",
    schema: {
      type: "object",
      properties: {
        statusCode: { type: "number", example: 401 },
        message: { type: "string", example: "Unauthorized" },
      },
    },
  })
  async listByMonth(
    @Query("month") month: string,
    @Req() req: AuthenticatedRequest
  ): Promise<EntryResponseDto[]> {
    try {
      // Validate month format (YYYY-MM)
      if (!month || !/^\d{4}-\d{2}$/.test(month)) {
        throw new BadRequestException(
          "Invalid month format. Use YYYY-MM format (e.g., 2025-01)"
        );
      }

      const [yearStr, monthStr] = month.split("-");
      const year = parseInt(yearStr, 10);
      const monthNum = parseInt(monthStr, 10);

      const entries = await this.listEntriesByMonthUseCase.execute({
        userId: req.user.id,
        year,
        month: monthNum,
      });

      return entries.map((entry) => ({
        id: entry.id,
        userId: entry.userId,
        description: entry.description,
        amount: entry.amount,
        date: entry.date,
        type: entry.type,
        isFixed: entry.isFixed,
        categoryId: entry.categoryId,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      }));
    } catch (error) {
      // Handle specific business logic errors (non-sensitive)
      if (this.isClientError(error.message)) {
        if (this.isNotFoundError(error.message)) {
          throw new NotFoundException(error.message);
        }
        throw new BadRequestException(error.message);
      }

      // Handle sensitive/unexpected errors
      console.error("Unexpected error in EntryController.listByMonth:", error);
      throw new InternalServerErrorException(
        "An unexpected error occurred while retrieving entries"
      );
    }
  }

  private isClientError(message: string): boolean {
    const clientErrorMessages = [
      "Amount must be greater than zero",
      "Description is required",
      "User ID is required",
      "User not found",
      "Category not found",
      "Category does not belong to the user",
      "Invalid year",
      "Invalid month",
    ];

    return clientErrorMessages.some((clientMsg) =>
      message.toLowerCase().includes(clientMsg.toLowerCase())
    );
  }

  private isNotFoundError(message: string): boolean {
    const notFoundMessages = ["User not found", "Category not found"];

    return notFoundMessages.some((notFoundMsg) =>
      message.toLowerCase().includes(notFoundMsg.toLowerCase())
    );
  }
}
