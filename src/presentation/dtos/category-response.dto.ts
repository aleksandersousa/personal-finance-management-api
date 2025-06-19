import { ApiProperty } from '@nestjs/swagger';
import { CategoryType } from '@domain/models/category.model';

export class CategoryResponseDto {
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
    description: 'User ID who owns this category',
    example: 'user-a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  userId: string;

  @ApiProperty({
    description: 'Whether this is a default system category',
    example: false,
  })
  isDefault: boolean;

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
