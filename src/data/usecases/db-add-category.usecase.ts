import { Injectable } from '@nestjs/common';
import { AddCategoryUseCase } from '@domain/usecases/add-category.usecase';
import { Category, CategoryCreateData } from '@domain/models/category.model';
import { CategoryRepository } from '@data/protocols/category-repository';

@Injectable()
export class DbAddCategoryUseCase implements AddCategoryUseCase {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async execute(data: CategoryCreateData): Promise<Category> {
    // Validate required fields
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Category name is required');
    }

    if (!data.type) {
      throw new Error('Category type is required');
    }

    if (!data.userId) {
      throw new Error('User ID is required');
    }

    // Validate name length
    if (data.name.length > 100) {
      throw new Error('Category name must be 100 characters or less');
    }

    // Validate description length
    if (data.description && data.description.length > 255) {
      throw new Error('Category description must be 255 characters or less');
    }

    // Check if category name already exists for the user
    const existingCategory = await this.categoryRepository.findByUserIdAndName(
      data.userId,
      data.name.trim(),
    );

    if (existingCategory) {
      throw new Error('Category name already exists for this user');
    }

    // Create the category
    const categoryData: CategoryCreateData = {
      ...data,
      name: data.name.trim(),
      description: data.description?.trim() || undefined,
    };

    return await this.categoryRepository.create(categoryData);
  }
}
