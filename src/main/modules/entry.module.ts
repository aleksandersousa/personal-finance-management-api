import { Module } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { EntryController } from '@presentation/controllers/entry.controller';
import { EntryEntity } from '@infra/db/typeorm/entities/entry.entity';
import { CategoryEntity } from '@infra/db/typeorm/entities/category.entity';
import {
  makeCategoryRepository,
  makeEntryRepository,
} from '@/main/factories/repositories';
import { UuidGenerator } from '@infra/implementations/uuid-generator';
import { DbAddEntryUseCase } from '@data/usecases/db-add-entry.usecase';
import { DbDeleteEntryUseCase } from '@data/usecases/db-delete-entry.usecase';
import { DbUpdateEntryUseCase } from '@data/usecases/db-update-entry.usecase';
import { AuthModule } from './auth.module';
import { ObservabilityModule } from './observability.module';
import {
  makeAddEntryFactory,
  makeDeleteEntryFactory,
  makeListEntriesByMonthFactory,
  makeUpdateEntryFactory,
} from '../factories';

@Module({
  imports: [
    TypeOrmModule.forFeature([EntryEntity, CategoryEntity]),
    AuthModule,
    ObservabilityModule,
  ],
  controllers: [EntryController],
  providers: [
    {
      provide: 'EntryRepository',
      useFactory: makeEntryRepository,
      inject: [
        getRepositoryToken(EntryEntity),
        'LoggerService',
        'ContextAwareLoggerService',
        'FinancialMetricsService',
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
      provide: DbAddEntryUseCase,
      useFactory: makeAddEntryFactory,
      inject: [
        'EntryRepository',
        'UserRepository',
        'CategoryRepository',
        'IdGenerator',
      ],
    },
    {
      provide: 'ListEntriesByMonthUseCase',
      useFactory: makeListEntriesByMonthFactory,
      inject: ['EntryRepository', 'UserRepository'],
    },
    {
      provide: DbUpdateEntryUseCase,
      useFactory: makeUpdateEntryFactory,
      inject: ['EntryRepository', 'UserRepository', 'CategoryRepository'],
    },
    {
      provide: DbDeleteEntryUseCase,
      useFactory: makeDeleteEntryFactory,
      inject: ['EntryRepository'],
    },
  ],
  exports: [
    DbAddEntryUseCase,
    'ListEntriesByMonthUseCase',
    DbDeleteEntryUseCase,
    DbUpdateEntryUseCase,
  ],
})
export class EntryModule {}
