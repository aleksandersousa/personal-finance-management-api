import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ForecastController } from '@presentation/controllers/forecast.controller';
import { EntryEntity } from '@infra/db/typeorm/entities/entry.entity';
import { PaymentEntity } from '@infra/db/typeorm/entities/payment.entity';
import { RecurrenceEntity } from '@infra/db/typeorm/entities/recurrence.entity';
import { TypeormEntryRepository } from '@infra/db/typeorm/repositories/typeorm-entry.repository';
import { ContextAwareLoggerService } from '@infra/logging/context-aware-logger.service';
import { FinancialMetricsService } from '@infra/metrics/financial-metrics.service';
import { ForecastCacheService } from '@infra/cache/forecast-cache.service';
import { makePredictCashFlowFactory } from '@main/factories/usecases/forecast/make-predict-cash-flow.factory';

@Module({
  imports: [
    TypeOrmModule.forFeature([EntryEntity, PaymentEntity, RecurrenceEntity]),
  ],
  controllers: [ForecastController],
  providers: [
    TypeormEntryRepository,
    ContextAwareLoggerService,
    FinancialMetricsService,
    ForecastCacheService,
    {
      provide: 'PredictCashFlowUseCase',
      useFactory: makePredictCashFlowFactory,
      inject: [
        TypeormEntryRepository,
        ContextAwareLoggerService,
        FinancialMetricsService,
        ForecastCacheService,
      ],
    },
    {
      provide: 'Logger',
      useClass: ContextAwareLoggerService,
    },
    {
      provide: 'Metrics',
      useClass: FinancialMetricsService,
    },
    {
      provide: 'ForecastCache',
      useClass: ForecastCacheService,
    },
  ],
  exports: [
    'PredictCashFlowUseCase',
    TypeormEntryRepository,
    ForecastCacheService,
  ],
})
export class ForecastModule {}
