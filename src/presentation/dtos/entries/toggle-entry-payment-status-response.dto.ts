import { ApiProperty } from '@nestjs/swagger';

export class ToggleEntryPaymentStatusResponseDto {
  @ApiProperty({
    description: 'Entry id',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  entryId: string;

  @ApiProperty({
    description: 'Current payment status',
    example: true,
  })
  isPaid: boolean;

  @ApiProperty({
    description: 'Payment creation date when paid',
    example: '2026-04-21T10:00:00.000Z',
    nullable: true,
  })
  paidAt: Date | null;
}
