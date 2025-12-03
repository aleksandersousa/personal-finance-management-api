import { Injectable } from '@nestjs/common';
import { ListCategoriesUseCase } from '@domain/usecases/list-categories.usecase';
import {
  CategoryListFilters,
  CategoryListResponse,
  CategoryWithStats,
  CategoryListSummary,
  CategoryType,
} from '@domain/models/category.model';
import { CategoryRepository } from '@/data/protocols/repositories/category-repository';

@Injectable()
export class DbListCategoriesUseCase implements ListCategoriesUseCase {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async execute(filters: CategoryListFilters): Promise<CategoryListResponse> {
    // Validate required fields
    if (!filters.userId) {
      throw new Error('User ID is required');
    }

    // Set default values for pagination
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));

    // Get categories with or without stats based on filters
    const result = await this.categoryRepository.findWithFilters({
      ...filters,
      page,
      limit,
    });

    // Ensure result.data is an array
    if (!Array.isArray(result.data)) {
      throw new Error('Invalid repository response: data is not an array');
    }

    // Calculate summary statistics
    const summary = this.calculateSummary(result.data);

    // Calculate pagination metadata
    const totalPages = Math.ceil(result.total / limit);
    const hasNext = page * limit < result.total;
    const hasPrev = page > 1;

    return {
      data: result.data,
      summary,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages,
        hasNext,
        hasPrev,
      },
    };
  }

  private calculateSummary(
    categories: CategoryWithStats[],
  ): CategoryListSummary {
    return {
      total: categories.length,
      income: categories.filter(c => c.type === CategoryType.INCOME).length,
      expense: categories.filter(c => c.type === CategoryType.EXPENSE).length,
      custom: categories.filter(c => !c.isDefault).length,
      default: categories.filter(c => c.isDefault).length,
    };
  }
}
