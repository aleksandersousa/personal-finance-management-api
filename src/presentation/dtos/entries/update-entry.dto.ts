import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EntryType } from '@domain/models/entry.model';

export class UpdateEntryDto {
  @ApiProperty({
    description: 'Entry description',
    example: 'Updated Monthly Salary',
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Entry amount',
    example: 5200.0,
    minimum: 0.01,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  amount: number;

  @ApiProperty({
    description: 'Entry date',
    example: '2025-01-15T10:00:00Z',
  })
  @IsNotEmpty()
  @IsDateString()
  date: string;

  @ApiProperty({
    description: 'Entry type',
    enum: ['INCOME', 'EXPENSE'],
    example: 'INCOME',
  })
  @IsNotEmpty()
  @IsEnum(['INCOME', 'EXPENSE'])
  type: EntryType;

  @ApiProperty({
    description: 'Whether this entry is fixed (recurring)',
    example: true,
  })
  @IsNotEmpty()
  @IsBoolean()
  isFixed: boolean;

  @ApiProperty({
    description: 'Category ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({
    description: 'Whether this entry is paid',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;
}
