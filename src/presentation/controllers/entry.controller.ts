import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  Post,
  Put,
  Patch,
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
import { AddEntryUseCase } from '@domain/usecases/add-entry.usecase';
import { ListEntriesByMonthUseCase } from '@domain/usecases/list-entries-by-month.usecase';
import { DeleteEntryUseCase } from '@domain/usecases/delete-entry.usecase';
import { UpdateEntryUseCase } from '@domain/usecases/update-entry.usecase';
import { GetEntriesMonthsYearsUseCase } from '@domain/usecases/get-entries-months-years.usecase';
import { ToggleEntryPaymentStatusUseCase } from '@domain/usecases/toggle-entry-payment-status.usecase';
import {
  CreateEntryDto,
  UpdateEntryDto,
  EntryResponseDto,
  EntryListResponseDto,
  DeleteEntryResponseDto,
  EntriesMonthsYearsResponseDto,
  ToggleEntryPaymentStatusDto,
  ToggleEntryPaymentStatusResponseDto,
} from '../dtos';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { User } from '../decorators/user.decorator';
import { Logger } from '@data/protocols/logger';
import { Metrics } from '@data/protocols/metrics';
import { UserPayload } from '@domain/models/user.model';
import { EntryRepository } from '@/data/protocols/repositories/entry-repository';

@ApiTags('entries')
@Controller('entries')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class EntryController {
  constructor(
    @Inject('AddEntryUseCase')
    private readonly addEntryUseCase: AddEntryUseCase,
    @Inject('ListEntriesByMonthUseCase')
    private readonly listEntriesByMonthUseCase: ListEntriesByMonthUseCase,
    @Inject('DeleteEntryUseCase')
    private readonly deleteEntryUseCase: DeleteEntryUseCase,
    @Inject('UpdateEntryUseCase')
    private readonly updateEntryUseCase: UpdateEntryUseCase,
    @Inject('ToggleEntryPaymentStatusUseCase')
    private readonly toggleEntryPaymentStatusUseCase: ToggleEntryPaymentStatusUseCase,
    @Inject('GetEntriesMonthsYearsUseCase')
    private readonly getEntriesMonthsYearsUseCase: GetEntriesMonthsYearsUseCase,
    @Inject('Logger')
    private readonly logger: Logger,
    @Inject('Metrics')
    private readonly metrics: Metrics,
    @Inject('EntryRepository')
    private readonly entryRepository: EntryRepository,
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
    const startTime = Date.now();

    try {
      const entry = await this.addEntryUseCase.execute({
        recurrenceId: await this.resolveRecurrenceId(
          createEntryDto.recurrenceId,
          createEntryDto.recurrenceType,
        ),
        userId: user.id,
        description: createEntryDto.description,
        amount: createEntryDto.amount,
        issueDate: new Date(createEntryDto.issueDate),
        dueDate: new Date(createEntryDto.dueDate),
        categoryId: createEntryDto.categoryId,
      });

      const duration = Date.now() - startTime;

      // Log business event
      this.logger.logBusinessEvent({
        event: 'entry_api_create_success',
        entityId: entry.id,
        userId: user.id,
        duration,
        metadata: {
          amount: entry.amount,
          recurrenceId: entry.recurrenceId,
        },
      });

      // Record metrics
      this.metrics.recordHttpRequest('POST', '/entries', 201, duration);

      return {
        id: entry.id,
        userId: entry.userId,
        description: entry.description,
        amount: entry.amount,
        issueDate: entry.issueDate,
        dueDate: entry.dueDate,
        categoryId: entry.categoryId,
        categoryName: entry.categoryName,
        entryType: entry.entryType,
        recurrenceId: entry.recurrenceId,
        isPaid: !!entry.payment,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      };
    } catch (error) {
      // Log error
      this.logger.error(
        `Failed to create entry for user ${user.id}`,
        error.stack,
      );

      // Record error metrics
      this.metrics.recordApiError('entry_create', error.message);

      if (this.isNotFoundError(error.message)) {
        throw new NotFoundException('Category not found');
      }
      if (this.isClientError(error.message)) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('Failed to create entry');
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
    name: 'category',
    required: false,
    description: "Filter by category ID or 'all' (default: all)",
    example: 'all',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description:
      'Search term for filtering entries by description (case-insensitive)',
    example: 'groceries',
  })
  @ApiQuery({
    name: 'entryType',
    required: false,
    description: "Filter by entry type: 'INCOME' or 'EXPENSE'",
    example: 'INCOME',
  })
  @ApiBadRequestResponse({ description: 'Invalid query parameters' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  async listByMonth(
    @Query('month') month: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('sort') sort: string = 'dueDate',
    @Query('order') order: string = 'desc',
    @Query('category') category: string = 'all',
    @Query('entryType') entryType: string = '',
    @Query('search') search: string = '',
    @User() user: UserPayload,
  ): Promise<EntryListResponseDto> {
    const startTime = Date.now();

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
      const validSortFields = ['dueDate', 'amount', 'description'];
      const validOrders = ['asc', 'desc'];

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
      const normalizedEntryType = entryType?.toUpperCase();
      if (
        normalizedEntryType &&
        !['INCOME', 'EXPENSE'].includes(normalizedEntryType)
      ) {
        throw new BadRequestException(
          'Invalid entryType. Must be one of: INCOME, EXPENSE',
        );
      }

      const result = await this.listEntriesByMonthUseCase.execute({
        userId: user.id,
        year,
        month: monthNum,
        page: pageNum,
        limit: limitNum,
        sort,
        order: order as 'asc' | 'desc',
        categoryId: category !== 'all' ? category : undefined,
        entryType: normalizedEntryType as 'INCOME' | 'EXPENSE' | undefined,
        search: search && search.trim() ? search.trim() : undefined,
      });

      const duration = Date.now() - startTime;

      this.logger.logBusinessEvent({
        event: 'entry_api_list_success',
        userId: user.id,
        duration,
        metadata: {
          month,
          page: pageNum,
          limit: limitNum,
          totalResults: result.data.length,
        },
      });

      this.metrics.recordHttpRequest('GET', '/entries', 200, duration);

      return {
        data: result.data,
        pagination: result.pagination,
        summary: result.summary,
      };
    } catch (error) {
      // Log error
      this.logger.error(
        `Failed to list entries for user ${user.id}`,
        error.stack,
      );

      // Record error metrics
      this.metrics.recordApiError('entry_list', error.message);

      if (this.isClientError(error.message)) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('Failed to retrieve entries');
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
    const startTime = Date.now();

    try {
      const entry = await this.updateEntryUseCase.execute({
        id,
        recurrenceId: await this.resolveRecurrenceId(
          updateEntryDto.recurrenceId,
          updateEntryDto.recurrenceType,
        ),
        userId: user.id,
        description: updateEntryDto.description,
        amount: updateEntryDto.amount,
        issueDate: new Date(updateEntryDto.issueDate),
        dueDate: new Date(updateEntryDto.dueDate),
        categoryId: updateEntryDto.categoryId,
      });

      const duration = Date.now() - startTime;

      // Log business event
      this.logger.logBusinessEvent({
        event: 'entry_api_update_success',
        entityId: entry.id,
        userId: user.id,
        duration,
        metadata: {
          amount: entry.amount,
          recurrenceId: entry.recurrenceId,
        },
      });

      // Record metrics
      this.metrics.recordHttpRequest('PUT', '/entries/:id', 200, duration);

      return {
        id: entry.id,
        userId: entry.userId,
        amount: entry.amount,
        description: entry.description,
        issueDate: entry.issueDate,
        dueDate: entry.dueDate,
        recurrenceId: entry.recurrenceId,
        categoryId: entry.categoryId,
        categoryName: entry.categoryName,
        entryType: entry.entryType,
        isPaid: !!entry.payment,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      };
    } catch (error) {
      // Log error
      this.logger.error(
        `Failed to update entry ${id} for user ${user.id}`,
        error.stack,
      );

      // Record error metrics
      this.metrics.recordApiError('entry_update', error.message);

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

  @Patch(':id/payment-status')
  @ApiOperation({
    summary: 'Toggle paid/unpaid status by payment relation',
    description:
      'Marks an entry as paid by creating a payment record, or unpaid by deleting it.',
  })
  @ApiParam({
    name: 'id',
    description: 'Entry ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment status updated successfully',
    type: ToggleEntryPaymentStatusResponseDto,
  })
  async togglePaymentStatus(
    @Param('id') id: string,
    @Body(ValidationPipe) body: ToggleEntryPaymentStatusDto,
    @User() user: UserPayload,
  ): Promise<ToggleEntryPaymentStatusResponseDto> {
    try {
      return await this.toggleEntryPaymentStatusUseCase.execute({
        userId: user.id,
        entryId: id,
        isPaid: body.isPaid,
      });
    } catch (error) {
      if (this.isClientError(error.message)) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('Failed to update payment status');
    }
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a financial entry',
    description:
      'Deletes a financial entry for the authenticated user. Implements UC-07 (Delete Entry).',
  })
  @ApiResponse({
    status: 200,
    description: 'Entry deleted successfully',
    type: DeleteEntryResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid entry ID' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiNotFoundResponse({ description: 'Entry not found' })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'Entry ID',
  })
  async delete(
    @Param('id') id: string,
    @User() user: UserPayload,
  ): Promise<DeleteEntryResponseDto> {
    const startTime = Date.now();

    try {
      const result = await this.deleteEntryUseCase.execute({
        userId: user.id,
        entryId: id,
      });

      const duration = Date.now() - startTime;

      this.logger.logBusinessEvent({
        event: 'entry_api_delete_success',
        entityId: id,
        userId: user.id,
        duration,
        deletedAt: result.deletedAt.toISOString(),
      });

      this.metrics.recordTransaction('delete', 'success');

      return {
        deletedAt: result.deletedAt,
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      this.logger.logSecurityEvent({
        event: 'entry_api_delete_failed',
        severity: 'medium',
        message: error.message,
        userId: user.id,
        entityId: id,
        error: error.message,
        endpoint: `DELETE /entries/${id}`,
        details: {
          duration,
        },
      });

      this.metrics.recordTransaction('delete', 'error');

      if (this.isNotFoundError(error.message)) {
        throw new NotFoundException(error.message);
      }
      if (this.isClientError(error.message)) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('Failed to delete entry');
    }
  }

  @Get('months-years')
  @ApiOperation({
    summary: 'Get distinct months and years from entries',
    description:
      'Retrieves a list of distinct months and years that have entries for the authenticated user. Useful for filtering and navigation purposes.',
  })
  @ApiResponse({
    status: 200,
    description: 'Months and years retrieved successfully',
    type: EntriesMonthsYearsResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid request' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  async getMonthsYears(
    @User() user: UserPayload,
  ): Promise<EntriesMonthsYearsResponseDto> {
    const startTime = Date.now();

    try {
      const result = await this.getEntriesMonthsYearsUseCase.execute({
        userId: user.id,
      });

      const duration = Date.now() - startTime;

      this.logger.logBusinessEvent({
        event: 'entry_api_months_years_success',
        userId: user.id,
        duration,
        metadata: {
          count: result.monthsYears.length,
        },
      });

      this.metrics.recordHttpRequest(
        'GET',
        '/entries/months-years',
        200,
        duration,
      );

      return {
        monthsYears: result.monthsYears,
      };
    } catch (error) {
      // Log error
      this.logger.error(
        `Failed to get months and years for user ${user.id}`,
        error.stack,
      );

      // Record error metrics
      this.metrics.recordApiError('entry_months_years', error.message);

      if (this.isClientError(error.message)) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('Failed to retrieve months and years');
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

  private async resolveRecurrenceId(
    recurrenceId: string | null | undefined,
    recurrenceType?: 'MONTHLY',
  ): Promise<string | null | undefined> {
    if (recurrenceId !== undefined) {
      return recurrenceId;
    }

    if (!recurrenceType) {
      return undefined;
    }

    const resolvedRecurrenceId =
      await this.entryRepository.findRecurrenceIdByType(recurrenceType);

    if (!resolvedRecurrenceId) {
      throw new BadRequestException(
        `Recurrence type ${recurrenceType} not found`,
      );
    }

    return resolvedRecurrenceId;
  }
}
