import { ApiProperty } from '@nestjs/swagger';

export class ToggleMonthlyPaymentResponseDto {
  @ApiProperty({
    description: 'Entry ID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  entryId: string;

  @ApiProperty({
    description: 'Year',
    example: 2025,
  })
  year: number;

  @ApiProperty({
    description: 'Month',
    example: 1,
  })
  month: number;

  @ApiProperty({
    description: 'Payment status',
    example: true,
  })
  isPaid: boolean;

  @ApiProperty({
    description: 'Date when marked as paid',
    example: '2025-01-15T10:30:00Z',
    nullable: true,
  })
  paidAt: Date | null;
}
