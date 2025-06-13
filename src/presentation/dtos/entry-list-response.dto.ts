import { ApiProperty } from "@nestjs/swagger";
import { EntryResponseDto } from "./entry-response.dto";

export class PaginationDto {
  @ApiProperty({
    description: "Current page number",
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: "Number of items per page",
    example: 20,
  })
  limit: number;

  @ApiProperty({
    description: "Total number of items",
    example: 45,
  })
  total: number;

  @ApiProperty({
    description: "Total number of pages",
    example: 3,
  })
  totalPages: number;

  @ApiProperty({
    description: "Whether there is a next page",
    example: true,
  })
  hasNext: boolean;

  @ApiProperty({
    description: "Whether there is a previous page",
    example: false,
  })
  hasPrev: boolean;
}

export class EntrySummaryDto {
  @ApiProperty({
    description: "Total income amount",
    example: 3500.0,
  })
  totalIncome: number;

  @ApiProperty({
    description: "Total expenses amount",
    example: 2100.0,
  })
  totalExpenses: number;

  @ApiProperty({
    description: "Balance (income - expenses)",
    example: 1400.0,
  })
  balance: number;

  @ApiProperty({
    description: "Total number of entries",
    example: 45,
  })
  entriesCount: number;
}

export class EntryListResponseDto {
  @ApiProperty({
    description: "List of entries",
    type: [EntryResponseDto],
  })
  data: EntryResponseDto[];

  @ApiProperty({
    description: "Pagination information",
    type: PaginationDto,
  })
  pagination: PaginationDto;

  @ApiProperty({
    description: "Summary information",
    type: EntrySummaryDto,
  })
  summary: EntrySummaryDto;
}
