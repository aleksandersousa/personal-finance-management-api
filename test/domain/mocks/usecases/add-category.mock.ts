import { AddCategoryUseCase } from '@domain/usecases/add-category.usecase';
import { Category } from '@domain/models/category.model';
import { mockCategory } from '../models/category.mock';

export class AddCategoryUseCaseMockFactory {
  static createSuccess(
    result: Category = mockCategory,
  ): jest.Mocked<AddCategoryUseCase> {
    return {
      execute: jest.fn().mockResolvedValue(result),
    };
  }

  static createFailure(error: Error): jest.Mocked<AddCategoryUseCase> {
    return {
      execute: jest.fn().mockRejectedValue(error),
    };
  }

  static createValidationFailure(): jest.Mocked<AddCategoryUseCase> {
    return {
      execute: jest.fn().mockRejectedValue(new Error('Validation failed')),
    };
  }

  static createDuplicateNameFailure(): jest.Mocked<AddCategoryUseCase> {
    return {
      execute: jest
        .fn()
        .mockRejectedValue(new Error('Category name already exists')),
    };
  }
}
