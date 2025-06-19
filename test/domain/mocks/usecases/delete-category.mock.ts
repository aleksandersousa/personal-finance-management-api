import { DeleteCategoryUseCase } from '@domain/usecases/delete-category.usecase';

export class DeleteCategoryUseCaseMockFactory {
  static createSuccess(): jest.Mocked<DeleteCategoryUseCase> {
    return {
      execute: jest.fn().mockResolvedValue({
        deletedAt: new Date('2025-06-01T15:30:00Z'),
      }),
    };
  }

  static createFailure(error: Error): jest.Mocked<DeleteCategoryUseCase> {
    return {
      execute: jest.fn().mockRejectedValue(error),
    };
  }

  static createNotFoundFailure(): jest.Mocked<DeleteCategoryUseCase> {
    return {
      execute: jest.fn().mockRejectedValue(new Error('Category not found')),
    };
  }

  static createUnauthorizedFailure(): jest.Mocked<DeleteCategoryUseCase> {
    return {
      execute: jest
        .fn()
        .mockRejectedValue(
          new Error('You can only delete your own categories'),
        ),
    };
  }

  static createDefaultCategoryFailure(): jest.Mocked<DeleteCategoryUseCase> {
    return {
      execute: jest
        .fn()
        .mockRejectedValue(new Error('Cannot delete default categories')),
    };
  }

  static createHasEntriesFailure(): jest.Mocked<DeleteCategoryUseCase> {
    return {
      execute: jest
        .fn()
        .mockRejectedValue(
          new Error('Cannot delete category with existing entries'),
        ),
    };
  }

  static createValidationFailure(): jest.Mocked<DeleteCategoryUseCase> {
    return {
      execute: jest
        .fn()
        .mockRejectedValue(new Error('Category ID is required')),
    };
  }
}
