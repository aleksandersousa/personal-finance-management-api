import {
  BadRequestException,
  Controller,
  Get,
  Inject,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { GetMonthlySummaryUseCase } from '@domain/usecases/get-monthly-summary.usecase';
import { MonthlySummaryResponseDto } from '../dtos/monthly-summary-response.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { User } from '../decorators/user.decorator';
import { Logger } from '@data/protocols/logger';
import { Metrics } from '@data/protocols/metrics';

interface UserPayload {
  id: string;
  email: string;
}

@ApiTags('summary')
@Controller('summary')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class SummaryController {
  constructor(
    @Inject('GetMonthlySummaryUseCase')
    private readonly getMonthlySummaryUseCase: GetMonthlySummaryUseCase,
    @Inject('Logger')
    private readonly logger: Logger,
    @Inject('Metrics')
    private readonly metrics: Metrics,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get monthly financial summary',
    description:
      'Retrieve comprehensive financial summary for a specific month including totals, balance, and optional category breakdown',
  })
  @ApiQuery({
    name: 'month',
    description: 'Month in YYYY-MM format',
    example: '2024-01',
    required: true,
  })
  @ApiQuery({
    name: 'includeCategories',
    description: 'Include category breakdown in response',
    example: 'true',
    required: false,
    type: 'boolean',
  })
  @ApiResponse({
    status: 200,
    description: 'Monthly summary retrieved successfully',
    type: MonthlySummaryResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid month format or parameters',
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
  })
  async getMonthlySummary(
    @Query('month') month: string,
    @Query('includeCategories') includeCategories?: string,
    @User() user?: UserPayload,
  ): Promise<MonthlySummaryResponseDto> {
    const startTime = Date.now();

    this.logger.log('Monthly summary request received', 'SummaryController');

    try {
      // Validate month format (YYYY-MM)
      const monthRegex = /^(\d{4})-(\d{2})$/;
      const match = month.match(monthRegex);

      if (!match) {
        throw new BadRequestException(
          'Invalid month format. Expected YYYY-MM (e.g., 2024-01)',
        );
      }

      const year = parseInt(match[1], 10);
      const monthNumber = parseInt(match[2], 10);

      // Validate year range
      if (year < 1900 || year > 2100) {
        throw new BadRequestException('Year must be between 1900 and 2100');
      }

      // Validate month range
      if (monthNumber < 1 || monthNumber > 12) {
        throw new BadRequestException('Month must be between 01 and 12');
      }

      // Parse includeCategories parameter (only 'true' should be true, case-insensitive)
      const shouldIncludeCategories =
        includeCategories?.toLowerCase() === 'true';

      const result = await this.getMonthlySummaryUseCase.execute({
        userId: user.id,
        year,
        month: monthNumber,
        includeCategories: shouldIncludeCategories,
      });

      const duration = Date.now() - startTime;

      // Log business event
      this.logger.logBusinessEvent({
        event: 'monthly_summary_generated',
        userId: user.id,
        metadata: {
          year,
          month: monthNumber,
          includeCategories: shouldIncludeCategories,
          duration,
        },
      });

      // Record metrics
      this.metrics.recordHttpRequest('GET', '/summary', 200, duration);

      this.logger.log(
        `Monthly summary generated successfully in ${duration}ms`,
        'SummaryController',
      );

      return result;
    } catch (error) {
      // Log error
      this.logger.error(
        'Failed to get monthly summary',
        error.stack,
        'SummaryController',
      );

      // Re-throw known validation errors as BadRequestException
      if (error instanceof BadRequestException) {
        throw error;
      }

      // For unknown errors, wrap in generic BadRequestException
      throw new BadRequestException('Failed to retrieve monthly summary');
    }
  }
}
