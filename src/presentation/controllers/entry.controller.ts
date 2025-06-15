import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { DbAddEntryUseCase } from '@data/usecases/db-add-entry.usecase';
import { DbListEntriesByMonthUseCase } from '@data/usecases/db-list-entries-by-month.usecase';
import { DbUpdateEntryUseCase } from '@data/usecases/db-update-entry.usecase';
import { CreateEntryDto } from '../dtos/create-entry.dto';
import { UpdateEntryDto } from '../dtos/update-entry.dto';
import { EntryResponseDto } from '../dtos/entry-response.dto';
import { EntryListResponseDto } from '../dtos/entry-list-response.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { User } from '../decorators/user.decorator';

interface UserPayload {
  id: string;
  email: string;
}

@ApiTags('entries')
@Controller('entries')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class EntryController {
  constructor(
    private readonly addEntryUseCase: DbAddEntryUseCase,
    @Inject('ListEntriesByMonthUseCase')
    private readonly listEntriesByMonthUseCase: DbListEntriesByMonthUseCase,
    private readonly updateEntryUseCase: DbUpdateEntryUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new financial entry',
    description:
      'Creates a new financial entry (income or expense) for the authenticated user. Supports UC-01 to UC-04 (Register Fixed/Dynamic Income/Expense).',
  })
  @ApiResponse({
    status: 201,
    description: 'Entry created successfully',
    type: EntryResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Validation failed or invalid data' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiNotFoundResponse({ description: 'Category not found' })
  @ApiBody({ type: CreateEntryDto })
  async create(
    @Body(ValidationPipe) createEntryDto: CreateEntryDto,
    @User() user: UserPayload,
  ): Promise<EntryResponseDto> {
    try {
      const entry = await this.addEntryUseCase.execute({
        userId: user.id,
        description: createEntryDto.description,
        amount: createEntryDto.amount,
        date: new Date(createEntryDto.date),
        type: createEntryDto.type,
        isFixed: createEntryDto.isFixed,
        categoryId: createEntryDto.categoryId,
      });

      return {
        id: entry.id,
        amount: entry.amount,
        description: entry.description,
        type: entry.type,
        isFixed: entry.isFixed,
        categoryId: entry.categoryId,
        categoryName: 'Category Name', // Would come from category service
        userId: entry.userId,
        date: entry.date,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      };
    } catch (error) {
      if (this.isNotFoundError(error.message)) {
        throw new NotFoundException('Category not found');
      }
      if (this.isClientError(error.message)) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('Failed to create entry');
    }
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update an existing financial entry',
    description:
      'Updates an existing financial entry for the authenticated user. Implements UC-06 (Update Entry). Users can only update their own entries.',
  })
  @ApiParam({
    name: 'id',
    description: 'Entry ID to update',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Entry updated successfully',
    type: EntryResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Validation failed or invalid data' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiNotFoundResponse({ description: 'Entry or category not found' })
  @ApiBody({ type: UpdateEntryDto })
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateEntryDto: UpdateEntryDto,
    @User() user: UserPayload,
  ): Promise<EntryResponseDto> {
    try {
      const entry = await this.updateEntryUseCase.execute({
        id,
        userId: user.id,
        description: updateEntryDto.description,
        amount: updateEntryDto.amount,
        date: new Date(updateEntryDto.date),
        type: updateEntryDto.type,
        isFixed: updateEntryDto.isFixed,
        categoryId: updateEntryDto.categoryId,
      });

      return {
        id: entry.id,
        amount: entry.amount,
        description: entry.description,
        type: entry.type,
        isFixed: entry.isFixed,
        categoryId: entry.categoryId,
        categoryName: 'Category Name', // Would come from category service
        userId: entry.userId,
        date: entry.date,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      };
    } catch (error) {
      if (this.isUnauthorizedError(error.message)) {
        throw new NotFoundException('Entry not found or access denied');
      }
      if (this.isNotFoundError(error.message)) {
        throw new NotFoundException(error.message);
      }
      if (this.isClientError(error.message)) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('Failed to update entry');
    }
  }

  @Get()
  @ApiOperation({
    summary: 'List entries by month with pagination and filters',
    description:
      'Retrieves financial entries for a specific month with pagination, sorting, and filtering options. Implements UC-05 (List Entries by Month).',
  })
  @ApiResponse({
    status: 200,
    description: 'Entries retrieved successfully',
    type: EntryListResponseDto,
  })
  @ApiQuery({
    name: 'month',
    required: true,
    description: 'Month in YYYY-MM format',
    example: '2024-01',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page (default: 20, max: 100)',
    example: 20,
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    description: 'Sort field: date, amount, description (default: date)',
    example: 'date',
  })
  @ApiQuery({
    name: 'order',
    required: false,
    description: 'Sort order: asc, desc (default: desc)',
    example: 'desc',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Filter by type: INCOME, EXPENSE, all (default: all)',
    example: 'all',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    description: "Filter by category ID or 'all' (default: all)",
    example: 'all',
  })
  @ApiBadRequestResponse({ description: 'Invalid query parameters' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  async listByMonth(
    @Query('month') month: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('sort') sort: string = 'date',
    @Query('order') order: string = 'desc',
    @Query('type') type: string = 'all',
    @Query('category') category: string = 'all',
    @User() user: UserPayload,
  ): Promise<EntryListResponseDto> {
    try {
      // Validate month format
      if (!month || !/^\d{4}-\d{2}$/.test(month)) {
        throw new BadRequestException('Month must be in YYYY-MM format');
      }

      // Parse and validate pagination parameters
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

      // Parse month
      const [yearStr, monthStr] = month.split('-');
      const year = parseInt(yearStr, 10);
      const monthNum = parseInt(monthStr, 10);

      // Validate date range
      if (year < 1900 || year > 2100 || monthNum < 1 || monthNum > 12) {
        throw new BadRequestException('Invalid year or month value');
      }

      // Validate query parameters
      const validSortFields = ['date', 'amount', 'description'];
      const validOrders = ['asc', 'desc'];
      const validTypes = ['INCOME', 'EXPENSE', 'all'];

      if (!validSortFields.includes(sort)) {
        throw new BadRequestException(
          `Invalid sort field. Must be one of: ${validSortFields.join(', ')}`,
        );
      }

      if (!validOrders.includes(order)) {
        throw new BadRequestException(
          `Invalid order. Must be one of: ${validOrders.join(', ')}`,
        );
      }

      if (!validTypes.includes(type)) {
        throw new BadRequestException(
          `Invalid type. Must be one of: ${validTypes.join(', ')}`,
        );
      }

      // Execute use case with all parameters - filtering and pagination now done at database level
      const result = await this.listEntriesByMonthUseCase.execute({
        userId: user.id,
        year,
        month: monthNum,
        page: pageNum,
        limit: limitNum,
        sort,
        order: order as 'asc' | 'desc',
        type: type as 'INCOME' | 'EXPENSE' | 'all',
        categoryId: category !== 'all' ? category : undefined,
      });

      // Map to response DTO format - data is already processed by use case
      return {
        data: result.data.map(entry => ({
          id: entry.id,
          amount: entry.amount,
          description: entry.description,
          type: entry.type,
          isFixed: entry.isFixed,
          categoryId: entry.categoryId,
          categoryName: 'Category Name', // TODO: This should come from category service
          userId: entry.userId,
          date: entry.date,
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt,
        })),
        pagination: result.pagination,
        summary: result.summary,
      };
    } catch (error) {
      if (this.isClientError(error.message)) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('Failed to retrieve entries');
    }
  }

  private isClientError(message: string): boolean {
    const clientErrorPatterns = [
      'validation',
      'invalid',
      'required',
      'must be',
      'cannot be',
      'already exists',
      'not found',
      'unauthorized',
      'forbidden',
    ];
    return clientErrorPatterns.some(pattern =>
      message.toLowerCase().includes(pattern),
    );
  }

  private isNotFoundError(message: string): boolean {
    return message.toLowerCase().includes('not found');
  }

  private isUnauthorizedError(message: string): boolean {
    return message.toLowerCase().includes('unauthorized');
  }
}
