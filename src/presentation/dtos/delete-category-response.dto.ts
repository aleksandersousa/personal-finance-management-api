import { ApiProperty } from '@nestjs/swagger';

export class DeleteCategoryResponseDto {
  @ApiProperty({
    description: 'Timestamp when the category was deleted',
    example: '2024-01-16T15:30:00Z',
  })
  deletedAt: Date;
}
