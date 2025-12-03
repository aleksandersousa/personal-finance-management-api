import { Injectable } from '@nestjs/common';
import {
  UpdateCategoryRequest,
  UpdateCategoryUseCase,
} from '@domain/usecases/update-category.usecase';
import { Category } from '@domain/models/category.model';
import { CategoryRepository } from '@/data/protocols/repositories/category-repository';

@Injectable()
export class DbUpdateCategoryUseCase implements UpdateCategoryUseCase {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async execute(request: UpdateCategoryRequest): Promise<Category> {
    // Validate required fields
    if (!request.id) {
      throw new Error('Category ID is required');
    }

    if (!request.userId) {
      throw new Error('User ID is required');
    }

    // Validate name if provided
    if (request.name !== undefined) {
      if (!request.name || request.name.trim().length === 0) {
        throw new Error('Category name cannot be empty');
      }

      if (request.name.length > 100) {
        throw new Error('Category name must be 100 characters or less');
      }
    }

    // Validate description length if provided
    if (request.description !== undefined && request.description.length > 255) {
      throw new Error('Category description must be 255 characters or less');
    }

    // Verify category exists
    const existingCategory = await this.categoryRepository.findById(request.id);
    if (!existingCategory) {
      throw new Error('Category not found');
    }

    // Verify ownership - user can only update their own categories
    if (existingCategory.userId !== request.userId) {
      throw new Error('You can only update your own categories');
    }

    // Verify category is not a default category
    if (existingCategory.isDefault) {
      throw new Error('Cannot update default categories');
    }

    // Check if new name already exists for the user (if name is being updated)
    if (request.name && request.name.trim() !== existingCategory.name) {
      const existingWithName =
        await this.categoryRepository.findByUserIdAndName(
          request.userId,
          request.name.trim(),
        );

      if (existingWithName) {
        throw new Error('Category name already exists for this user');
      }
    }

    // Prepare update data
    const updateData: any = {};

    if (request.name !== undefined) {
      updateData.name = request.name.trim();
    }

    if (request.description !== undefined) {
      updateData.description = request.description.trim() || undefined;
    }

    if (request.color !== undefined) {
      updateData.color = request.color;
    }

    if (request.icon !== undefined) {
      updateData.icon = request.icon;
    }

    if (request.type !== undefined) {
      updateData.type = request.type;
    }

    const updatedCategory = await this.categoryRepository.update(
      request.id,
      updateData,
    );

    return updatedCategory;
  }
}
