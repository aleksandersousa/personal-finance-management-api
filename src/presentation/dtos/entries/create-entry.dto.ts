import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEntryDto {
  @ApiProperty({
    description: 'Entry description',
    example: 'Salary - January 2025',
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Entry amount',
    example: 5000.0,
    minimum: 0.01,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  amount: number;

  @ApiProperty({
    description: 'Issue date',
    example: '2025-01-15T10:00:00Z',
  })
  @IsNotEmpty()
  @IsDateString()
  issueDate: string;

  @ApiProperty({
    description: 'Due date',
    example: '2025-01-15T10:00:00Z',
  })
  @IsNotEmpty()
  @IsDateString()
  dueDate: string;

  @ApiProperty({
    description: 'Category ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: true,
  })
  @IsNotEmpty()
  @IsUUID()
  categoryId: string;

  @ApiProperty({
    description: 'Recurrence ID',
    example: '123e4567-e89b-12d3-a456-426614174111',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  recurrenceId?: string | null;

  @ApiProperty({
    description: 'Recurrence type',
    example: 'MONTHLY',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(['MONTHLY'])
  recurrenceType?: 'MONTHLY';
}
