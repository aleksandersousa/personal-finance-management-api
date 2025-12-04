import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { ConfigService } from '@nestjs/config';
import { UserEntity } from '../entities/user.entity';
import { EntryEntity } from '../entities/entry.entity';
import { CategoryEntity } from '../entities/category.entity';
import { EmailVerificationTokenEntity } from '../entities/email-verification-token.entity';

const configService = new ConfigService();
const dbSchema = configService.get<string>('DB_SCHEMA') || 'financial';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  schema: dbSchema,
  url: configService.get<string>('DATABASE_URL'),
  entities: [
    UserEntity,
    EntryEntity,
    CategoryEntity,
    EmailVerificationTokenEntity,
  ],
  migrations: ['dist/src/infra/db/typeorm/migrations/*.js'],
  migrationsTableName: 'migrations',
  extra: {
    options: `-c search_path=${dbSchema},public`,
  },
  synchronize: configService.get<string>('NODE_ENV') === 'development',
  logging: false,
  ssl: false,
});

export const typeOrmConfig = {
  type: 'postgres' as const,
  schema: dbSchema,
  url: configService.get<string>('DATABASE_URL'),
  entities: [
    UserEntity,
    EntryEntity,
    CategoryEntity,
    EmailVerificationTokenEntity,
  ],
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
