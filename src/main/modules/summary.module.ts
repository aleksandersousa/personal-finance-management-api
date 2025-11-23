import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SummaryController } from '@presentation/controllers/summary.controller';
import { EntryEntity } from '@infra/db/typeorm/entities/entry.entity';
import { UserEntity } from '@infra/db/typeorm/entities/user.entity';
import { TypeormEntryRepository } from '@infra/db/typeorm/repositories/typeorm-entry.repository';
import { TypeormUserRepository } from '@infra/db/typeorm/repositories/typeorm-user.repository';
import { ContextAwareLoggerService } from '@infra/logging/context-aware-logger.service';
import { FinancialMetricsService } from '@infra/metrics/financial-metrics.service';
import { makeGetMonthlySummaryFactory } from '@main/factories/usecases/summary/make-get-monthly-summary.factory';

@Module({
  imports: [TypeOrmModule.forFeature([EntryEntity, UserEntity])],
  controllers: [SummaryController],
  providers: [
    TypeormEntryRepository,
    TypeormUserRepository,
    ContextAwareLoggerService,
    FinancialMetricsService,
    {
      provide: 'GetMonthlySummaryUseCase',
      useFactory: makeGetMonthlySummaryFactory,
      inject: [
        TypeormEntryRepository,
        TypeormUserRepository,
        ContextAwareLoggerService,
        FinancialMetricsService,
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
  ],
  exports: [
    'GetMonthlySummaryUseCase',
    TypeormEntryRepository,
    TypeormUserRepository,
  ],
})
export class SummaryModule {}
