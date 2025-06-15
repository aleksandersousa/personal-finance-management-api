import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({
    description: 'Application status',
    example: 'ok',
  })
  status: string;

  @ApiProperty({
    description: 'Application uptime in seconds',
    example: 3600,
  })
  uptime: number;

  @ApiProperty({
    description: 'Current timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'Database connection status',
    example: 'connected',
  })
  database: string;

  @ApiProperty({
    description: 'Application version',
    example: '1.0.0',
  })
  version: string;
}
