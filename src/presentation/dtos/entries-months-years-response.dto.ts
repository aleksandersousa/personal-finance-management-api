import { ApiProperty } from '@nestjs/swagger';

export class MonthYearDto {
  @ApiProperty({
    description: 'Year',
    example: 2024,
  })
  year: number;

  @ApiProperty({
    description: 'Month (1-12)',
    example: 1,
    minimum: 1,
    maximum: 12,
  })
  month: number;
}

export class EntriesMonthsYearsResponseDto {
  @ApiProperty({
    description: 'List of distinct months and years from entries',
    type: [MonthYearDto],
  })
  monthsYears: MonthYearDto[];
}
