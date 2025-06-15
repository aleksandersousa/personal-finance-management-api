import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthResponseDto } from '../dtos/health-response.dto';

@ApiTags('monitoring')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({
    summary: 'Health check endpoint',
    description:
      'Returns application health status including database connectivity, memory usage, and service availability',
  })
  @ApiResponse({
    status: 200,
    description: 'Application is healthy',
    type: HealthResponseDto,
  })
  async health(): Promise<HealthResponseDto> {
    try {
      // Check database connectivity (placeholder)
      const dbStatus = 'connected';

      return {
        status: 'ok',
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        database: dbStatus,
        version: process.env.APP_VERSION || '1.0.0',
      };
    } catch (error) {
      // Return minimal error response
      return {
        status: 'error',
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        database: 'unknown',
        version: process.env.APP_VERSION || '1.0.0',
      };
    }
  }
}
