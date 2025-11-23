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
      inject: [getRepositoryToken(EntryEntity), 'Logger', 'Metrics'],
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
      provide: 'AddEntryUseCase',
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
      provide: 'UpdateEntryUseCase',
      useFactory: makeUpdateEntryFactory,
      inject: ['EntryRepository', 'UserRepository', 'CategoryRepository'],
    },
    {
      provide: 'DeleteEntryUseCase',
      useFactory: makeDeleteEntryFactory,
      inject: ['EntryRepository'],
    },
  ],
  exports: [
    'AddEntryUseCase',
    'ListEntriesByMonthUseCase',
    'UpdateEntryUseCase',
    'DeleteEntryUseCase',
  ],
})
export class EntryModule {}
