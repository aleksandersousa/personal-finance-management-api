import { Module } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { EntryController } from '@presentation/controllers/entry.controller';
import { EntryEntity } from '@infra/db/typeorm/entities/entry.entity';
import { CategoryEntity } from '@infra/db/typeorm/entities/category.entity';
import { makeEntryRepository } from '@main/factories/entry.factory';
import { TypeormCategoryRepository } from '@infra/db/typeorm/repositories/typeorm-category.repository';
import { UuidGenerator } from '@infra/implementations/uuid-generator';
import { DbAddEntryUseCase } from '@data/usecases/db-add-entry.usecase';
import { DbListEntriesByMonthUseCase } from '@data/usecases/db-list-entries-by-month.usecase';
import { DbDeleteEntryUseCase } from '@data/usecases/db-delete-entry.usecase';
import { DbUpdateEntryUseCase } from '@data/usecases/db-update-entry.usecase';
import { AuthModule } from './auth.module';
import { ObservabilityModule } from './observability.module';

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
      useFactory: (repository, logger, metrics) =>
        makeEntryRepository(repository, logger, metrics),
      inject: [
        getRepositoryToken(EntryEntity),
        'LoggerService',
        'ContextAwareLoggerService',
        'FinancialMetricsService',
      ],
    },
    {
      provide: 'CategoryRepository',
      useFactory: repository => new TypeormCategoryRepository(repository),
      inject: [getRepositoryToken(CategoryEntity)],
    },
    {
      provide: 'IdGenerator',
      useClass: UuidGenerator,
    },
    {
      provide: DbAddEntryUseCase,
      useFactory: (
        entryRepository,
        userRepository,
        categoryRepository,
        idGenerator,
      ) =>
        new DbAddEntryUseCase(
          entryRepository,
          userRepository,
          categoryRepository,
          idGenerator,
        ),
      inject: [
        'EntryRepository',
        'UserRepository',
        'CategoryRepository',
        'IdGenerator',
      ],
    },
    {
      provide: 'ListEntriesByMonthUseCase',
      useFactory: (entryRepository, userRepository) =>
        new DbListEntriesByMonthUseCase(entryRepository, userRepository),
      inject: ['EntryRepository', 'UserRepository'],
    },
    {
      provide: DbUpdateEntryUseCase,
      useFactory: (entryRepository, userRepository, categoryRepository) =>
        new DbUpdateEntryUseCase(
          entryRepository,
          userRepository,
          categoryRepository,
        ),
      inject: ['EntryRepository', 'UserRepository', 'CategoryRepository'],
    },
    {
      provide: DbDeleteEntryUseCase,
      useFactory: entryRepository => new DbDeleteEntryUseCase(entryRepository),
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
