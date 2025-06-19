import { Injectable } from '@nestjs/common';
import { ListCategoriesUseCase } from '@domain/usecases/list-categories.usecase';
import {
  CategoryListFilters,
  CategoryListResponse,
  CategoryWithStats,
  CategoryListSummary,
  CategoryType,
} from '@domain/models/category.model';
import { CategoryRepository } from '@data/protocols/category-repository';

@Injectable()
export class DbListCategoriesUseCase implements ListCategoriesUseCase {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async execute(filters: CategoryListFilters): Promise<CategoryListResponse> {
    // Validate required fields
    if (!filters.userId) {
      throw new Error('User ID is required');
    }

    // Get categories with or without stats based on filters
    const categories = await this.categoryRepository.findWithFilters(filters);

    // Calculate summary statistics
    const summary = this.calculateSummary(categories);

    return {
      data: categories,
      summary,
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
