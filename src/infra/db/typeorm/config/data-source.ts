import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { UserEntity } from '../entities/user.entity';
import { EntryEntity } from '../entities/entry.entity';
import { CategoryEntity } from '../entities/category.entity';
import { EmailVerificationTokenEntity } from '../entities/email-verification-token.entity';
import { NotificationEntity } from '../entities/notification.entity';
import { PasswordResetTokenEntity } from '../entities/password-reset-token.entity';
import { UserSettingEntity } from '../entities/user-setting.entity';
import { RecurrenceEntity } from '../entities/recurrence.entity';
import { PaymentEntity } from '../entities/payment.entity';

const configService = new ConfigService();
const dbSchema = configService.get<string>('DB_SCHEMA') || 'financial';
const migrationPaths = [
  join(__dirname, '../migrations/*.js'),
  join(__dirname, '../migrations/*.ts'),
];

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
    NotificationEntity,
    PasswordResetTokenEntity,
    UserSettingEntity,
    RecurrenceEntity,
    PaymentEntity,
  ],
  migrations: migrationPaths,
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
    NotificationEntity,
    PasswordResetTokenEntity,
    UserSettingEntity,
    RecurrenceEntity,
    PaymentEntity,
  ],
  migrations: migrationPaths,
  migrationsTableName: 'migrations',
  extra: {
    options: `-c search_path=${dbSchema},public`,
  },
  synchronize: configService.get<string>('NODE_ENV') === 'development',
  logging: false,
  ssl: false,
  autoLoadEntities: true,
};
