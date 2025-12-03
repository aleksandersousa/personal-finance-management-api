import { Injectable } from '@nestjs/common';
import {
  DeleteCategoryRequest,
  DeleteCategoryResponse,
  DeleteCategoryUseCase,
} from '@domain/usecases/delete-category.usecase';
import { CategoryRepository } from '@/data/protocols/repositories/category-repository';

@Injectable()
export class DbDeleteCategoryUseCase implements DeleteCategoryUseCase {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async execute(
    request: DeleteCategoryRequest,
  ): Promise<DeleteCategoryResponse> {
    // Validate required fields
    if (!request.id) {
      throw new Error('Category ID is required');
    }

    if (!request.userId) {
      throw new Error('User ID is required');
    }

    // Verify category exists
    const existingCategory = await this.categoryRepository.findById(request.id);
    if (!existingCategory) {
      throw new Error('Category not found');
    }

    // Verify ownership - user can only delete their own categories
    if (existingCategory.userId !== request.userId) {
      throw new Error('You can only delete your own categories');
    }

    // Verify category is not a default category
    if (existingCategory.isDefault) {
      throw new Error('Cannot delete default categories');
    }

    // Check if category has associated entries
    const hasEntries = await this.categoryRepository.hasEntriesAssociated(
      request.id,
    );
    if (hasEntries) {
      throw new Error('Cannot delete category with existing entries');
    }

    // Perform soft delete
    await this.categoryRepository.softDelete(request.id);

    return {
      deletedAt: new Date(),
    };
  }
}
