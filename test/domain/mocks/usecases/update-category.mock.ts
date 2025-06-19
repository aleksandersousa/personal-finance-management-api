import { UpdateCategoryUseCase } from '@domain/usecases/update-category.usecase';
import { Category } from '@domain/models/category.model';
import { mockCategory } from '../models/category.mock';

export class UpdateCategoryUseCaseMockFactory {
  static createSuccess(
    result: Category = mockCategory,
  ): jest.Mocked<UpdateCategoryUseCase> {
    return {
      execute: jest.fn().mockResolvedValue(result),
    };
  }

  static createFailure(error: Error): jest.Mocked<UpdateCategoryUseCase> {
    return {
      execute: jest.fn().mockRejectedValue(error),
    };
  }

  static createValidationFailure(): jest.Mocked<UpdateCategoryUseCase> {
    return {
      execute: jest.fn().mockRejectedValue(new Error('Validation failed')),
    };
  }

  static createNotFoundFailure(): jest.Mocked<UpdateCategoryUseCase> {
    return {
      execute: jest.fn().mockRejectedValue(new Error('Category not found')),
    };
  }

  static createUnauthorizedFailure(): jest.Mocked<UpdateCategoryUseCase> {
    return {
      execute: jest
        .fn()
        .mockRejectedValue(
          new Error('You can only update your own categories'),
        ),
    };
  }

  static createDefaultCategoryFailure(): jest.Mocked<UpdateCategoryUseCase> {
    return {
      execute: jest
        .fn()
        .mockRejectedValue(new Error('Cannot update default categories')),
    };
  }

  static createDuplicateNameFailure(): jest.Mocked<UpdateCategoryUseCase> {
    return {
      execute: jest
        .fn()
        .mockRejectedValue(
          new Error('Category name already exists for this user'),
        ),
    };
  }
}
