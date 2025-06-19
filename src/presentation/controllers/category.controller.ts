import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Request,
  Inject,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@presentation/guards/jwt-auth.guard';
import {
  CreateCategoryDto,
  CategoryResponseDto,
  CategoryListResponseDto,
} from '@presentation/dtos';
import { AddCategoryUseCase } from '@domain/usecases/add-category.usecase';
import { ListCategoriesUseCase } from '@domain/usecases/list-categories.usecase';
import {
  Category,
  CategoryType,
  CategoryListResponse,
  CategoryWithStats,
} from '@domain/models/category.model';
import type { Logger, Metrics } from '@/data/protocols';

@Controller('categories')
@ApiTags('categories')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CategoryController {
  constructor(
    @Inject('AddCategoryUseCase')
    private readonly addCategoryUseCase: AddCategoryUseCase,
    @Inject('ListCategoriesUseCase')
    private readonly listCategoriesUseCase: ListCategoriesUseCase,
    @Inject('Logger')
    private readonly logger: Logger,
    @Inject('Metrics')
    private readonly metrics: Metrics,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List user categories with optional filters' })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: [...Object.values(CategoryType), 'all'],
    description: 'Filter by category type',
    example: 'all',
  })
  @ApiQuery({
    name: 'includeStats',
    required: false,
    type: Boolean,
    description: 'Include usage statistics',
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
    type: CategoryListResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  async list(
    @Query('type') type: CategoryType | 'all' = 'all',
    @Query('includeStats') includeStats: string = 'false',
    @Request() req: any,
  ): Promise<CategoryListResponseDto> {
    const startTime = Date.now();

    try {
      const includeStatsBoolean = includeStats === 'true';

      const result = await this.listCategoriesUseCase.execute({
        userId: req.user.id,
        type: type === 'all' ? undefined : type,
        includeStats: includeStatsBoolean,
      });

      const duration = Date.now() - startTime;

      this.logger.logBusinessEvent({
        event: 'category_api_list_success',
        userId: req.user.id,
        duration,
        traceId: req.traceId,
        metadata: {
          type: type,
          includeStats: includeStatsBoolean,
          resultCount: result.data.length,
        },
      });

      this.metrics.recordHttpRequest('GET', '/categories', 200, duration);
      return this.mapToListResponseDto(result);
    } catch (error) {
      const duration = Date.now() - startTime;

      this.logger.logSecurityEvent({
        event: 'category_api_list_failed',
        severity: 'medium',
        userId: req.user.id,
        error: error.message,
        traceId: req.traceId,
        message: `Failed to list categories`,
        endpoint: '/categories',
      });

      this.metrics.recordHttpRequest('GET', '/categories', 400, duration);
      this.metrics.recordApiError('categories', error.message);
      throw error;
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({
    status: 201,
    description: 'Category created successfully',
    type: CategoryResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or category name already exists',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
    @Request() req: any,
  ): Promise<CategoryResponseDto> {
    const startTime = Date.now();

    try {
      const category = await this.addCategoryUseCase.execute({
        ...createCategoryDto,
        userId: req.user.id,
      });

      const duration = Date.now() - startTime;

      this.logger.logBusinessEvent({
        event: 'category_api_create_success',
        entityId: category.id,
        userId: req.user.id,
        duration,
        traceId: req.traceId,
        metadata: {
          categoryName: category.name,
          categoryType: category.type,
        },
      });

      this.metrics.recordHttpRequest('POST', '/categories', 201, duration);
      return this.mapToResponseDto(category);
    } catch (error) {
      const duration = Date.now() - startTime;

      this.logger.logSecurityEvent({
        event: 'category_api_create_failed',
        severity: 'medium',
        userId: req.user.id,
        error: error.message,
        traceId: req.traceId,
        message: `Failed to create category: ${createCategoryDto.name}`,
        endpoint: '/categories',
      });

      this.metrics.recordHttpRequest('POST', '/categories', 400, duration);
      this.metrics.recordApiError('categories', error.message);
      throw error;
    }
  }

  private mapToListResponseDto(
    result: CategoryListResponse,
  ): CategoryListResponseDto {
    return {
      data: result.data.map(this.mapToWithStatsResponseDto),
      summary: result.summary,
    };
  }

  private mapToWithStatsResponseDto(category: CategoryWithStats) {
    return {
      id: category.id,
      name: category.name,
      description: category.description,
      type: category.type,
      color: category.color,
      icon: category.icon,
      isDefault: category.isDefault,
      entriesCount: category.entriesCount,
      totalAmount: category.totalAmount,
      lastUsed: category.lastUsed,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }

  private mapToResponseDto(category: Category): CategoryResponseDto {
    return {
      id: category.id,
      name: category.name,
      description: category.description,
      type: category.type,
      color: category.color,
      icon: category.icon,
      userId: category.userId,
      isDefault: category.isDefault,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }
}
