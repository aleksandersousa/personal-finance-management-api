import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ToggleEntryPaymentStatusDto {
  @ApiProperty({
    description: 'Whether entry should be marked as paid',
    example: true,
  })
  @IsBoolean()
  isPaid: boolean;
}
