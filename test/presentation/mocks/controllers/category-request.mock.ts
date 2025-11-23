import { CreateCategoryDto } from '@presentation/dtos';
import { CategoryType } from '@domain/models/category.model';

export const mockCreateCategoryRequest: CreateCategoryDto = {
  name: 'Freelance Work',
  description: 'Income from freelance projects',
  type: CategoryType.INCOME,
  color: '#4CAF50',
  icon: 'work',
};

export class CategoryRequestMockFactory {
  static createValid(): CreateCategoryDto {
    return { ...mockCreateCategoryRequest };
  }

  static createExpense(): CreateCategoryDto {
    return {
      ...mockCreateCategoryRequest,
      name: 'Housing',
      description: 'Rent and utilities',
      type: CategoryType.EXPENSE,
      color: '#F44336',
      icon: 'home',
    };
  }

  static createMinimal(): CreateCategoryDto {
    return {
      name: 'Simple Category',
      type: CategoryType.INCOME,
    };
  }

  static createWithLongName(): CreateCategoryDto {
    return {
      ...mockCreateCategoryRequest,
      name: 'a'.repeat(101), // Invalid: too long
    };
  }

  static createWithInvalidColor(): CreateCategoryDto {
    return {
      ...mockCreateCategoryRequest,
      color: 'invalid-color', // Invalid: not hex format
    };
  }

  static createWithEmptyName(): CreateCategoryDto {
    return {
      ...mockCreateCategoryRequest,
      name: '', // Invalid: empty name
    };
  }
}
