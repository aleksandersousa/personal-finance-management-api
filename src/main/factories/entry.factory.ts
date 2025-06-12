import { DbAddEntryUseCase } from "@data/usecases/db-add-entry.usecase";
import { DbListEntriesByMonthUseCase } from "@data/usecases/db-list-entries-by-month.usecase";
import { TypeormEntryRepository } from "@infra/db/typeorm/repositories/typeorm-entry.repository";
import { TypeormUserRepository } from "@infra/db/typeorm/repositories/typeorm-user.repository";
import { TypeormCategoryRepository } from "@infra/db/typeorm/repositories/typeorm-category.repository";
import { UuidGenerator } from "@infra/implementations/uuid-generator";
import { EntryController } from "@presentation/controllers/entry.controller";
import { getRepositoryToken } from "@nestjs/typeorm";
import { EntryEntity } from "@infra/db/typeorm/entities/entry.entity";
import { Repository } from "typeorm";

// Factory para criar o caso de uso AddEntry
export const makeAddEntryUseCase = (
  entryRepository: TypeormEntryRepository,
  userRepository: TypeormUserRepository,
  categoryRepository: TypeormCategoryRepository,
  idGenerator?: UuidGenerator
): DbAddEntryUseCase => {
  const generator = idGenerator || new UuidGenerator();
  return new DbAddEntryUseCase(
    entryRepository,
    userRepository,
    categoryRepository,
    generator
  );
};

// Factory para criar o caso de uso ListEntriesByMonth
export const makeListEntriesByMonthUseCase = (
  entryRepository: TypeormEntryRepository,
  userRepository: TypeormUserRepository
): DbListEntriesByMonthUseCase => {
  return new DbListEntriesByMonthUseCase(entryRepository, userRepository);
};

// Factory para criar o repositório de entradas
export const makeEntryRepository = (
  repository: Repository<EntryEntity>
): TypeormEntryRepository => {
  return new TypeormEntryRepository(repository);
};

// Factory para criar o controller Entry
export const makeEntryController = (
  addEntryUseCase: DbAddEntryUseCase,
  listEntriesByMonthUseCase: DbListEntriesByMonthUseCase
): EntryController => {
  return new EntryController(addEntryUseCase, listEntriesByMonthUseCase);
};

// Provider completo para uso no módulo NestJS
export const entryProviders = [
  {
    provide: "EntryRepository",
    useFactory: (repository: Repository<EntryEntity>) => {
      return makeEntryRepository(repository);
    },
    inject: [getRepositoryToken(EntryEntity)],
  },
  {
    provide: "IdGenerator",
    useValue: new UuidGenerator(),
  },
  {
    provide: DbAddEntryUseCase,
    useFactory: (
      entryRepository: TypeormEntryRepository,
      userRepository: TypeormUserRepository,
      categoryRepository: TypeormCategoryRepository,
      idGenerator: UuidGenerator
    ) => {
      return new DbAddEntryUseCase(
        entryRepository,
        userRepository,
        categoryRepository,
        idGenerator
      );
    },
    inject: [
      "EntryRepository",
      "UserRepository",
      "CategoryRepository",
      "IdGenerator",
    ],
  },
  {
    provide: DbListEntriesByMonthUseCase,
    useFactory: (
      entryRepository: TypeormEntryRepository,
      userRepository: TypeormUserRepository
    ) => {
      return new DbListEntriesByMonthUseCase(entryRepository, userRepository);
    },
    inject: ["EntryRepository", "UserRepository"],
  },
];

// Função utilitária para obter todas as dependências
export const makeEntryDependencies = () => {
  return {
    repository: TypeormEntryRepository,
    addUseCase: DbAddEntryUseCase,
    listByMonthUseCase: DbListEntriesByMonthUseCase,
    controller: EntryController,
    idGenerator: UuidGenerator,
  };
};
