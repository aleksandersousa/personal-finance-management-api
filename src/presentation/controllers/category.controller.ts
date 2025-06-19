import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Inject,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@presentation/guards/jwt-auth.guard';
import { CreateCategoryDto, CategoryResponseDto } from '@presentation/dtos';
import { AddCategoryUseCase } from '@domain/usecases/add-category.usecase';
import { Category } from '@domain/models/category.model';
import type { Logger, Metrics } from '@/data/protocols';

@Controller('categories')
@ApiTags('categories')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CategoryController {
  constructor(
    @Inject('AddCategoryUseCase')
    private readonly addCategoryUseCase: AddCategoryUseCase,
    @Inject('Logger')
    private readonly logger: Logger,
    @Inject('Metrics')
    private readonly metrics: Metrics,
  ) {}

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
