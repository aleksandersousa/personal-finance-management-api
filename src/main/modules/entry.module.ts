import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { EntryController } from '@presentation/controllers/entry.controller';
import { EntryEntity } from '@infra/db/typeorm/entities/entry.entity';
import { EntryMonthlyPaymentEntity } from '@infra/db/typeorm/entities/entry-monthly-payment.entity';
import { CategoryEntity } from '@infra/db/typeorm/entities/category.entity';
import {
  makeCategoryRepository,
  makeEntryRepository,
} from '@/main/factories/repositories';
import { UuidGenerator } from '@infra/implementations/uuid-generator';
import { AuthModule } from './auth.module';
import { ObservabilityModule } from './observability.module';
import { NotificationModule } from './notification.module';
import {
  makeAddEntryFactory,
  makeDeleteEntryFactory,
  makeListEntriesByMonthFactory,
  makeUpdateEntryFactory,
  makeGetEntriesMonthsYearsFactory,
  makeToggleMonthlyPaymentStatusFactory,
} from '../factories';
import { ContextAwareLoggerService } from '@/infra/logging/context-aware-logger.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EntryEntity,
      EntryMonthlyPaymentEntity,
      CategoryEntity,
    ]),
    AuthModule,
    ObservabilityModule,
    forwardRef(() => NotificationModule),
  ],
  controllers: [EntryController],
  providers: [
    {
      provide: 'EntryRepository',
      useFactory: makeEntryRepository,
      inject: [
        getRepositoryToken(EntryEntity),
        getRepositoryToken(EntryMonthlyPaymentEntity),
        'Logger',
        'Metrics',
      ],
    },
    {
      provide: 'CategoryRepository',
      useFactory: makeCategoryRepository,
      inject: [getRepositoryToken(CategoryEntity)],
    },
    {
      provide: 'IdGenerator',
      useClass: UuidGenerator,
    },
    {
      provide: 'Logger',
      useClass: ContextAwareLoggerService,
    },
    {
      provide: 'AddEntryUseCase',
      useFactory: makeAddEntryFactory,
      inject: [
        'EntryRepository',
        'UserRepository',
        'CategoryRepository',
        'IdGenerator',
        { token: 'CreateNotificationUseCase', optional: true },
      ],
    },
    {
      provide: 'ListEntriesByMonthUseCase',
      useFactory: makeListEntriesByMonthFactory,
      inject: ['EntryRepository', 'UserRepository'],
    },
    {
      provide: 'UpdateEntryUseCase',
      useFactory: makeUpdateEntryFactory,
      inject: [
        'EntryRepository',
        'UserRepository',
        'CategoryRepository',
        { token: 'CreateNotificationUseCase', optional: true },
        { token: 'CancelNotificationUseCase', optional: true },
      ],
    },
    {
      provide: 'DeleteEntryUseCase',
      useFactory: makeDeleteEntryFactory,
      inject: [
        'EntryRepository',
        { token: 'CancelNotificationUseCase', optional: true },
      ],
    },
    {
      provide: 'GetEntriesMonthsYearsUseCase',
      useFactory: makeGetEntriesMonthsYearsFactory,
      inject: ['EntryRepository', 'UserRepository', 'Logger'],
    },
    {
      provide: 'ToggleMonthlyPaymentStatusUseCase',
      useFactory: makeToggleMonthlyPaymentStatusFactory,
      inject: ['EntryRepository'],
    },
  ],
  exports: [
    'AddEntryUseCase',
    'ListEntriesByMonthUseCase',
    'UpdateEntryUseCase',
    'DeleteEntryUseCase',
    'GetEntriesMonthsYearsUseCase',
    'ToggleMonthlyPaymentStatusUseCase',
    'EntryRepository',
  ],
})
export class EntryModule {}
