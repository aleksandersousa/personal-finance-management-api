import { ListCategoriesUseCase } from '@domain/usecases/list-categories.usecase';
import {
  CategoryListResponse,
  CategoryListSummary,
} from '@domain/models/category.model';
import { MockCategoryFactory } from '../models/category.mock';

export class ListCategoriesUseCaseMockFactory {
  static createSuccess(
    resultData = [MockCategoryFactory.createWithStats()],
    summary: CategoryListSummary = {
      total: 1,
      income: 1,
      expense: 0,
      custom: 1,
      default: 0,
    },
  ): jest.Mocked<ListCategoriesUseCase> {
    const result: CategoryListResponse = {
      data: resultData,
      summary,
    };

    return {
      execute: jest.fn().mockResolvedValue(result),
    };
  }

  static createFailure(error: Error): jest.Mocked<ListCategoriesUseCase> {
    return {
      execute: jest.fn().mockRejectedValue(error),
    };
  }

  static createValidationFailure(): jest.Mocked<ListCategoriesUseCase> {
    return {
      execute: jest.fn().mockRejectedValue(new Error('User ID is required')),
    };
  }

  static createEmptyResult(): jest.Mocked<ListCategoriesUseCase> {
    const result: CategoryListResponse = {
      data: [],
      summary: {
        total: 0,
        income: 0,
        expense: 0,
        custom: 0,
        default: 0,
      },
    };

    return {
      execute: jest.fn().mockResolvedValue(result),
    };
  }

  static createMultipleCategories(): jest.Mocked<ListCategoriesUseCase> {
    const categories = [
      MockCategoryFactory.createWithStats(),
      MockCategoryFactory.create({
        name: 'Housing',
        type: 'EXPENSE' as any,
        isDefault: true,
      }),
      MockCategoryFactory.create({
        name: 'Food',
        type: 'EXPENSE' as any,
        isDefault: false,
      }),
    ];

    const result: CategoryListResponse = {
      data: categories,
      summary: {
        total: 3,
        income: 1,
        expense: 2,
        custom: 2,
        default: 1,
      },
    };

    return {
      execute: jest.fn().mockResolvedValue(result),
    };
  }
}
