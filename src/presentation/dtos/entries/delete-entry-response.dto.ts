import { ApiProperty } from '@nestjs/swagger';

export class DeleteEntryResponseDto {
  @ApiProperty({
    description: 'Timestamp when the entry was deleted',
    example: '2024-01-16T15:30:00Z',
  })
  deletedAt: Date;
}
