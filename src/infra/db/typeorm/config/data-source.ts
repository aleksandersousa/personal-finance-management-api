import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { ConfigService } from '@nestjs/config';
import { UserEntity } from '../entities/user.entity';
import { EntryEntity } from '../entities/entry.entity';
import { CategoryEntity } from '../entities/category.entity';

const configService = new ConfigService();
const dbSchema = configService.get<string>('DB_SCHEMA') || 'financial';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  schema: dbSchema,
  url:
    configService.get<string>('DATABASE_URL') ||
    'postgresql://postgres:postgres@localhost:5432/financial_db',
  entities: [UserEntity, EntryEntity, CategoryEntity],
  migrations: ['dist/src/infra/db/typeorm/migrations/*.js'],
  migrationsTableName: 'migrations',
  extra: {
    options: `-c search_path=${dbSchema},public`,
  },
  synchronize: configService.get<string>('NODE_ENV') === 'development',
  logging: configService.get<string>('NODE_ENV') === 'development',
  ssl: false,
});

export const typeOrmConfig = {
  type: 'postgres' as const,
  schema: dbSchema,
  url:
    configService.get<string>('DATABASE_URL') ||
    'postgresql://postgres:postgres@localhost:5432/financial_db',
  entities: [UserEntity, EntryEntity, CategoryEntity],
  migrations: ['dist/src/infra/db/typeorm/migrations/*.js'],
  migrationsTableName: 'migrations',
  extra: {
    options: `-c search_path=${dbSchema},public`,
  },
  synchronize: configService.get<string>('NODE_ENV') === 'development',
  logging: configService.get<string>('NODE_ENV') === 'development',
  ssl: false,
  autoLoadEntities: true,
};
