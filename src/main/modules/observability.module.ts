import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ContextAwareLoggerService } from '../../infra/logging/context-aware-logger.service';
import { FinancialMetricsService } from '../../infra/metrics/financial-metrics.service';
import { MetricsInterceptor } from '../../presentation/interceptors/metrics.interceptor';
import { MetricsController } from '../../presentation/controllers/metrics.controller';

@Global()
@Module({
  providers: [
    {
      provide: 'LoggerService',
      useClass: ContextAwareLoggerService,
    },
    {
      provide: 'Logger',
      useClass: ContextAwareLoggerService,
    },
    {
      provide: 'Metrics',
      useClass: FinancialMetricsService,
    },
    ContextAwareLoggerService,
    FinancialMetricsService,
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
  ],
  controllers: [MetricsController],
  exports: [
    'LoggerService',
    'Logger',
    'Metrics',
    ContextAwareLoggerService,
    FinancialMetricsService,
  ],
})
export class ObservabilityModule {}
