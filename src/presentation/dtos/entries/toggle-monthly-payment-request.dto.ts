import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, Max, Min } from 'class-validator';

export class ToggleMonthlyPaymentRequestDto {
  @ApiProperty({
    description: 'Year of the payment status',
    example: 2025,
    minimum: 1900,
    maximum: 2100,
  })
  @IsInt()
  @Min(1900)
  @Max(2100)
  year: number;

  @ApiProperty({
    description: 'Month of the payment status (1-12)',
    example: 1,
    minimum: 1,
    maximum: 12,
  })
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @ApiProperty({
    description: 'Payment status to set',
    example: true,
  })
  @IsBoolean()
  isPaid: boolean;
}
