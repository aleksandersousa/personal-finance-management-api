import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class EntryResponseDto {
  @ApiProperty({
    description: 'Entry unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'User ID who owns this entry',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  userId: string;

  @ApiProperty({
    description: 'Entry description',
    example: 'Salary - January 2025',
  })
  description: string;

  @ApiProperty({
    description: 'Entry amount',
    example: 5000.0,
  })
  amount: number;

  @ApiProperty({
    description: 'Entry issue date',
    example: '2025-01-15T10:00:00Z',
  })
  issueDate: Date;

  @ApiProperty({
    description: 'Entry due date',
    example: '2025-01-15T10:00:00Z',
  })
  dueDate: Date;

  @ApiProperty({
    description: 'Category ID',
    example: '123e4567-e89b-12d3-a456-426614174002',
    nullable: true,
  })
  categoryId?: string;

  @ApiProperty({
    description: 'Category name',
    example: 'Salary',
    nullable: true,
  })
  categoryName?: string;

  @ApiProperty({
    description: 'Recurrence ID',
    example: '123e4567-e89b-12d3-a456-426614174110',
    nullable: true,
  })
  recurrenceId: string | null;

  @ApiProperty({
    description: 'Entry type inferred from category',
    enum: ['INCOME', 'EXPENSE'],
    required: false,
  })
  @IsOptional()
  entryType?: 'INCOME' | 'EXPENSE';

  @ApiProperty({
    description:
      'Whether the entry has a related payment record (paid when true)',
    example: false,
  })
  isPaid: boolean;

  @ApiProperty({
    description: 'Entry creation date',
    example: '2025-01-15T10:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Entry last update date',
    example: '2025-01-15T10:00:00Z',
  })
  updatedAt: Date;
}
