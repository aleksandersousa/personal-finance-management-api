import { CategoryType } from '@/domain/models/category.model';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  MaxLength,
  IsNotEmpty,
  Matches,
  IsEnum,
} from 'class-validator';

export class UpdateCategoryDto {
  @ApiProperty({
    description: 'Category name',
    example: 'Updated Freelance Work',
    required: false,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100, { message: 'Category name must be 100 characters or less' })
  name?: string;

  @ApiProperty({
    description: 'Category description',
    example: 'Updated income from freelance projects',
    required: false,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, {
    message: 'Category description must be 255 characters or less',
  })
  description?: string;

  @ApiProperty({
    description: 'Category color in hex format',
    example: '#FF5722',
    required: false,
    pattern: '^#[0-9A-Fa-f]{6}$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'Color must be a valid hex color (e.g., #FF5722)',
  })
  color?: string;

  @ApiProperty({
    description: 'Category icon identifier',
    example: 'updated_work',
    required: false,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Icon must be 50 characters or less' })
  icon?: string;

  @IsEnum(CategoryType)
  @ApiProperty({
    description: 'Category type',
    enum: CategoryType,
    example: CategoryType.INCOME,
  })
  @IsOptional()
  type?: CategoryType;
}
