import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
  Inject,
  HttpException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@presentation/guards/jwt-auth.guard';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryResponseDto,
  CategoryListResponseDto,
  DeleteCategoryResponseDto,
} from '@presentation/dtos';
import { AddCategoryUseCase } from '@domain/usecases/add-category.usecase';
import { ListCategoriesUseCase } from '@domain/usecases/list-categories.usecase';
import { UpdateCategoryUseCase } from '@domain/usecases/update-category.usecase';
import { DeleteCategoryUseCase } from '@domain/usecases/delete-category.usecase';
import {
  Category,
  CategoryType,
  CategoryListResponse,
  CategoryWithStats,
} from '@domain/models/category.model';
import type { Logger, Metrics } from '@/data/protocols';
import { User } from '@presentation/decorators/user.decorator';

interface UserPayload {
  id: string;
  email: string;
}

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
    @Inject('UpdateCategoryUseCase')
    private readonly updateCategoryUseCase: UpdateCategoryUseCase,
    @Inject('DeleteCategoryUseCase')
    private readonly deleteCategoryUseCase: DeleteCategoryUseCase,
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
    name: 'search',
    required: false,
    description:
      'Search term for filtering categories by name (case-insensitive)',
    example: 'groceries',
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
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('search') search: string = '',
    @User() user: UserPayload,
    @Request() req: any,
  ): Promise<CategoryListResponseDto> {
    const startTime = Date.now();

    try {
      const includeStatsBoolean = includeStats === 'true';

      // Parse and validate pagination parameters
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

      const result = await this.listCategoriesUseCase.execute({
        userId: user.id,
        type: type === 'all' ? undefined : type,
        includeStats: includeStatsBoolean,
        page: pageNum,
        limit: limitNum,
        search: search && search.trim() ? search.trim() : undefined,
      });

      const duration = Date.now() - startTime;

      this.logger.logBusinessEvent({
        event: 'category_api_list_success',
        userId: user.id,
        duration,
        traceId: req.traceId,
        metadata: {
          type: type,
          includeStats: includeStatsBoolean,
          resultCount: result.data.length,
          page: pageNum,
          limit: limitNum,
          total: result.pagination?.total || result.data.length,
          search: search && search.trim() ? search.trim() : undefined,
        },
      });

      this.metrics.recordHttpRequest('GET', '/categories', 200, duration);
      return this.mapToListResponseDto(result);
    } catch (error) {
      const duration = Date.now() - startTime;

      this.logger.logSecurityEvent({
        event: 'category_api_list_failed',
        severity: 'medium',
        userId: user.id,
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
    @User() user: UserPayload,
    @Request() req: any,
  ): Promise<CategoryResponseDto> {
    const startTime = Date.now();

    try {
      const category = await this.addCategoryUseCase.execute({
        ...createCategoryDto,
        userId: user.id,
      });

      const duration = Date.now() - startTime;

      this.logger.logBusinessEvent({
        event: 'category_api_create_success',
        entityId: category.id,
        userId: user.id,
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
        userId: user.id,
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

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing category' })
  @ApiParam({
    name: 'id',
    description: 'Category ID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Category updated successfully',
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
  @ApiResponse({
    status: 403,
    description:
      'Forbidden - cannot update default categories or categories belonging to other users',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @User() user: UserPayload,
    @Request() req: any,
  ): Promise<CategoryResponseDto> {
    const startTime = Date.now();

    try {
      const category = await this.updateCategoryUseCase.execute({
        id,
        userId: user.id,
        ...updateCategoryDto,
      });

      const duration = Date.now() - startTime;

      this.logger.logBusinessEvent({
        event: 'category_api_update_success',
        entityId: category.id,
        userId: user.id,
        duration,
        traceId: req.traceId,
        metadata: {
          categoryName: category.name,
          updatedFields: Object.keys(updateCategoryDto),
        },
      });

      this.metrics.recordHttpRequest('PUT', `/categories/${id}`, 200, duration);
      return this.mapToResponseDto(category);
    } catch (error) {
      const duration = Date.now() - startTime;

      this.logger.logSecurityEvent({
        event: 'category_api_update_failed',
        severity: 'medium',
        userId: user.id,
        error: error.message,
        traceId: req.traceId,
        message: `Failed to update category: ${id}`,
        endpoint: `/categories/${id}`,
      });

      // Map specific error messages to appropriate HTTP status codes
      const errorMessage = error.message.toLowerCase();
      let httpStatus = 400;
      let httpException: HttpException;

      if (errorMessage.includes('not found')) {
        httpStatus = 404;
        httpException = new NotFoundException(error.message);
      } else if (
        errorMessage.includes('cannot update default') ||
        errorMessage.includes('only update your own')
      ) {
        httpStatus = 403;
        httpException = new ForbiddenException(error.message);
      } else if (errorMessage.includes('already exists')) {
        httpStatus = 409;
        httpException = new ConflictException(error.message);
      } else {
        httpException = new BadRequestException(error.message);
      }

      this.metrics.recordHttpRequest(
        'PUT',
        `/categories/${id}`,
        httpStatus,
        duration,
      );
      this.metrics.recordApiError('categories', error.message);
      throw httpException;
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a category' })
  @ApiParam({
    name: 'id',
    description: 'Category ID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Category deleted successfully',
    type: DeleteCategoryResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete category with existing entries',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden - cannot delete default categories or categories belonging to other users',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  async delete(
    @Param('id') id: string,
    @User() user: UserPayload,
    @Request() req: any,
  ): Promise<DeleteCategoryResponseDto> {
    const startTime = Date.now();

    try {
      const result = await this.deleteCategoryUseCase.execute({
        id,
        userId: user.id,
      });

      const duration = Date.now() - startTime;

      this.logger.logBusinessEvent({
        event: 'category_api_delete_success',
        entityId: id,
        userId: user.id,
        duration,
        traceId: req.traceId,
        deletedAt: result.deletedAt.toISOString(),
      });

      this.metrics.recordHttpRequest(
        'DELETE',
        `/categories/${id}`,
        200,
        duration,
      );
      return {
        deletedAt: result.deletedAt,
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      this.logger.logSecurityEvent({
        event: 'category_api_delete_failed',
        severity: 'medium',
        userId: user.id,
        error: error.message,
        traceId: req.traceId,
        message: `Failed to delete category: ${id}`,
        endpoint: `/categories/${id}`,
      });

      // Map specific error messages to appropriate HTTP status codes
      const errorMessage = error.message.toLowerCase();
      let httpStatus = 400;
      let httpException: HttpException;

      if (errorMessage.includes('not found')) {
        httpStatus = 404;
        httpException = new NotFoundException(error.message);
      } else if (
        errorMessage.includes('cannot delete default') ||
        errorMessage.includes('only delete your own') ||
        errorMessage.includes('cannot delete category with existing entries')
      ) {
        httpStatus = 403;
        httpException = new ForbiddenException(error.message);
      } else {
        httpException = new BadRequestException(error.message);
      }

      this.metrics.recordHttpRequest(
        'DELETE',
        `/categories/${id}`,
        httpStatus,
        duration,
      );
      this.metrics.recordApiError('categories', error.message);
      throw httpException;
    }
  }

  private mapToListResponseDto(
    result: CategoryListResponse,
  ): CategoryListResponseDto {
    return {
      data: result.data.map(this.mapToWithStatsResponseDto),
      summary: result.summary,
      pagination: result.pagination,
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
      entriesCount: category.entriesCount || 0,
      totalAmount: category.totalAmount || 0,
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
