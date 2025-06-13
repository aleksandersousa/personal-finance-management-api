import { Module, Global } from "@nestjs/common";
import { ContextAwareLoggerService } from "../../infra/logging/context-aware-logger.service";
import { FinancialMetricsService } from "../../infra/metrics/financial-metrics.service";
import { MetricsInterceptor } from "../../presentation/interceptors/metrics.interceptor";
import { MetricsController } from "../../presentation/controllers/metrics.controller";

@Global()
@Module({
  providers: [
    {
      provide: "LoggerService",
      useClass: ContextAwareLoggerService,
    },
    ContextAwareLoggerService,
    FinancialMetricsService,
    MetricsInterceptor,
  ],
  controllers: [MetricsController],
  exports: [
    "LoggerService",
    ContextAwareLoggerService,
    FinancialMetricsService,
    MetricsInterceptor,
  ],
})
export class ObservabilityModule {}
