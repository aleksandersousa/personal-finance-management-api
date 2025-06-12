import { DataSource } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { UserEntity } from "../entities/user.entity";
import { EntryEntity } from "../entities/entry.entity";
import { CategoryEntity } from "../entities/category.entity";

const configService = new ConfigService();

export const AppDataSource = new DataSource({
  type: "postgres",
  url:
    configService.get<string>("DATABASE_URL") ||
    "postgresql://postgres:postgres@localhost:5432/financial_db",
  entities: [UserEntity, EntryEntity, CategoryEntity],
  migrations: ["dist/infra/db/typeorm/migrations/*.js"],
  synchronize: configService.get<string>("NODE_ENV") === "development",
  logging: configService.get<string>("NODE_ENV") === "development",
  ssl: false,
});

export const typeOrmConfig = {
  type: "postgres" as const,
  url:
    configService.get<string>("DATABASE_URL") ||
    "postgresql://postgres:postgres@localhost:5432/financial_db",
  entities: [UserEntity, EntryEntity, CategoryEntity],
  migrations: ["dist/infra/db/typeorm/migrations/*.js"],
  synchronize: configService.get<string>("NODE_ENV") === "development",
  logging: configService.get<string>("NODE_ENV") === "development",
  ssl: false,
  autoLoadEntities: true,
};
