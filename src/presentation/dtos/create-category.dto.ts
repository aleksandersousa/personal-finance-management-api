import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CategoryType } from '@domain/models/category.model';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @ApiProperty({
    description: 'Category name',
    example: 'Freelance Work',
    maxLength: 100,
  })
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @ApiProperty({
    description: 'Category description',
    example: 'Income from freelance projects',
    required: false,
    maxLength: 255,
  })
  description?: string;

  @IsEnum(CategoryType)
  @ApiProperty({
    description: 'Category type',
    enum: CategoryType,
    example: CategoryType.INCOME,
  })
  type: CategoryType;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'Color must be a valid hex color (e.g., #4CAF50)',
  })
  @ApiProperty({
    description: 'Category color in hex format',
    example: '#4CAF50',
    required: false,
    pattern: '^#[0-9A-Fa-f]{6}$',
  })
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @ApiProperty({
    description: 'Category icon identifier',
    example: 'work',
    required: false,
    maxLength: 50,
  })
  icon?: string;
}
