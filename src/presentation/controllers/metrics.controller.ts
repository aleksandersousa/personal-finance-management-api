import { Controller, Get, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { FinancialMetricsService } from '@infra/metrics/financial-metrics.service';

@ApiTags('monitoring')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: FinancialMetricsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get Prometheus metrics',
    description:
      'Returns all application metrics in Prometheus format for monitoring and alerting',
  })
  @ApiResponse({
    status: 200,
    description: 'Prometheus metrics',
    content: {
      'text/plain': {
        schema: {
          type: 'string',
          example:
            '# HELP http_requests_total Total number of HTTP requests\n# TYPE http_requests_total counter\nhttp_requests_total{method="get",route="/health",status_code="200"} 1',
        },
      },
    },
  })
  async getMetrics(@Res() res: Response): Promise<void> {
    try {
      const metrics = await this.metricsService.getMetrics();

      res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
      res.end(metrics);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to retrieve metrics',
        message: error.message,
      });
    }
  }
}
