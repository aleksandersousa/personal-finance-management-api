import { Module } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { CategoryEntity } from '@infra/db/typeorm/entities';
import { CategoryController } from '@presentation/controllers';
import {
  makeAddCategoryFactory,
  makeListCategoriesFactory,
} from '@main/factories/usecases/categories';
import { makeCategoryRepository } from '@/main/factories/repositories';
import { AuthModule } from './auth.module';
import { ObservabilityModule } from './observability.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CategoryEntity]),
    AuthModule,
    ObservabilityModule,
  ],
  controllers: [CategoryController],
  providers: [
    {
      provide: 'CategoryRepository',
      useFactory: makeCategoryRepository,
      inject: [getRepositoryToken(CategoryEntity), 'Logger', 'Metrics'],
    },
    {
      provide: 'AddCategoryUseCase',
      useFactory: makeAddCategoryFactory,
      inject: ['CategoryRepository'],
    },
    {
      provide: 'ListCategoriesUseCase',
      useFactory: makeListCategoriesFactory,
      inject: ['CategoryRepository'],
    },
  ],
  exports: ['AddCategoryUseCase', 'ListCategoriesUseCase'],
})
export class CategoryModule {}
