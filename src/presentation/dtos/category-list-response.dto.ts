import { ApiProperty } from '@nestjs/swagger';
import { CategoryType } from '@domain/models/category.model';

export class CategoryWithStatsResponseDto {
  @ApiProperty({
    description: 'Category unique identifier',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  id: string;

  @ApiProperty({
    description: 'Category name',
    example: 'Freelance Work',
  })
  name: string;

  @ApiProperty({
    description: 'Category description',
    example: 'Income from freelance projects',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Category type',
    enum: CategoryType,
    example: CategoryType.INCOME,
  })
  type: CategoryType;

  @ApiProperty({
    description: 'Category color in hex format',
    example: '#4CAF50',
    required: false,
  })
  color?: string;

  @ApiProperty({
    description: 'Category icon identifier',
    example: 'work',
    required: false,
  })
  icon?: string;

  @ApiProperty({
    description: 'Whether this is a default system category',
    example: false,
  })
  isDefault: boolean;

  @ApiProperty({
    description: 'Number of entries in this category',
    example: 12,
    required: false,
  })
  entriesCount?: number;

  @ApiProperty({
    description: 'Total amount for all entries in this category',
    example: 60000.0,
    required: false,
  })
  totalAmount?: number;

  @ApiProperty({
    description: 'Date when this category was last used',
    example: '2025-06-01T00:00:00Z',
    required: false,
  })
  lastUsed?: Date | null;

  @ApiProperty({
    description: 'Category creation date',
    example: '2025-06-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Category last update date',
    example: '2025-06-01T00:00:00Z',
  })
  updatedAt: Date;
}

export class CategoryListSummaryDto {
  @ApiProperty({
    description: 'Total number of categories',
    example: 8,
  })
  total: number;

  @ApiProperty({
    description: 'Number of income categories',
    example: 3,
  })
  income: number;

  @ApiProperty({
    description: 'Number of expense categories',
    example: 5,
  })
  expense: number;

  @ApiProperty({
    description: 'Number of custom categories',
    example: 6,
  })
  custom: number;

  @ApiProperty({
    description: 'Number of default categories',
    example: 2,
  })
  default: number;
}

export class CategoryListResponseDto {
  @ApiProperty({
    description: 'List of categories',
    type: [CategoryWithStatsResponseDto],
  })
  data: CategoryWithStatsResponseDto[];

  @ApiProperty({
    description: 'Summary statistics',
    type: CategoryListSummaryDto,
  })
  summary: CategoryListSummaryDto;
}
