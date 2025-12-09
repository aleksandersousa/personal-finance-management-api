import { SCHEMA_NAME, TABLE_NAMES } from '@/domain/constants';
import { CategoryType } from '@/domain/models';
import { NotificationStatus } from '@/domain/models/notification.model';
import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class InitialSchema1733087000000 implements MigrationInterface {
  name = 'InitialSchema1733087000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.createSchemaAndExtensions(queryRunner);

    await this.createTables(queryRunner);

    await this.createIndexes(queryRunner);

    await this.createTriggers(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop Triggers
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS update_entries_updated_at ON "${SCHEMA_NAME}"."${TABLE_NAMES.ENTRIES}"`,
    );
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS update_categories_updated_at ON "${SCHEMA_NAME}"."${TABLE_NAMES.CATEGORIES}"`,
    );
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS update_users_updated_at ON "${SCHEMA_NAME}"."${TABLE_NAMES.USERS}"`,
    );

    // Drop the function
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS ${SCHEMA_NAME}.update_updated_at_column()`,
    );

    // Drop Tables (respect FK order)
    await queryRunner.dropTable(`${SCHEMA_NAME}.${TABLE_NAMES.ENTRIES}`, true);
    await queryRunner.dropTable(
      `${SCHEMA_NAME}.${TABLE_NAMES.CATEGORIES}`,
      true,
    );
    await queryRunner.dropTable(
      `${SCHEMA_NAME}.${TABLE_NAMES.EMAIL_VERIFICATION_TOKENS}`,
      true,
    );
    await queryRunner.dropTable(
      `${SCHEMA_NAME}.${TABLE_NAMES.PASSWORD_RESET_TOKENS}`,
      true,
    );
    await queryRunner.dropTable(`${SCHEMA_NAME}.${TABLE_NAMES.USERS}`, true);
    await queryRunner.dropTable(
      `${SCHEMA_NAME}.${TABLE_NAMES.NOTIFICATIONS}`,
      true,
    );

    // Drop Schema
    await queryRunner.dropSchema(SCHEMA_NAME, true);
  }

  private async createSchemaAndExtensions(
    queryRunner: QueryRunner,
  ): Promise<void> {
    await queryRunner.createSchema(SCHEMA_NAME, true);
    await queryRunner.query(
      `CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA "public"`,
    );
    await queryRunner.query(
      `CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA "public"`,
    );
  }

  private async createTables(queryRunner: QueryRunner): Promise<void> {
    // Users Table
    await queryRunner.createTable(
      new Table({
        schema: SCHEMA_NAME,
        name: TABLE_NAMES.USERS,
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'public.uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'email',
            type: 'varchar',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'password',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'avatar_url',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'email_verified',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'notification_enabled',
            type: 'boolean',
            default: true,
            isNullable: true,
          },
          {
            name: 'notification_time_minutes',
            type: 'integer',
            default: 30,
            isNullable: false,
          },
          {
            name: 'timezone',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Set timezone default value and constraint for users table
    await queryRunner.query(
      `ALTER TABLE "${SCHEMA_NAME}"."${TABLE_NAMES.USERS}" ALTER COLUMN timezone SET DEFAULT 'America/Sao_Paulo'`,
    );
    await queryRunner.query(
      `ALTER TABLE "${SCHEMA_NAME}"."${TABLE_NAMES.USERS}" ALTER COLUMN timezone SET NOT NULL`,
    );

    // Categories Table
    await queryRunner.createTable(
      new Table({
        schema: SCHEMA_NAME,
        name: TABLE_NAMES.CATEGORIES,
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'public.uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'icon',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'color',
            type: 'varchar',
            length: '7',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'enum',
            enum: Object.values(CategoryType),
            isNullable: false,
          },
          {
            name: 'is_default',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
        foreignKeys: [
          new TableForeignKey({
            name: 'FK_categories_users',
            columnNames: ['user_id'],
            referencedColumnNames: ['id'],
            referencedTableName: `${SCHEMA_NAME}.${TABLE_NAMES.USERS}`,
            onDelete: 'CASCADE',
          }),
        ],
      }),
      true,
    );

    // Entries Table
    await queryRunner.createTable(
      new Table({
        schema: SCHEMA_NAME,
        name: TABLE_NAMES.ENTRIES,
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'public.uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'category_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'amount',
            type: 'numeric',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'date',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'enum',
            enum: Object.values(CategoryType),
            isNullable: false,
          },
          {
            name: 'is_fixed',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'is_paid',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'notification_time_minutes',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
        foreignKeys: [
          new TableForeignKey({
            name: 'FK_entries_users',
            columnNames: ['user_id'],
            referencedColumnNames: ['id'],
            referencedTableName: `${SCHEMA_NAME}.${TABLE_NAMES.USERS}`,
            onDelete: 'CASCADE',
          }),
          new TableForeignKey({
            name: 'FK_entries_categories',
            columnNames: ['category_id'],
            referencedColumnNames: ['id'],
            referencedTableName: `${SCHEMA_NAME}.${TABLE_NAMES.CATEGORIES}`,
            onDelete: 'SET NULL',
          }),
        ],
      }),
      true,
    );

    // Notifications Table
    await queryRunner.createTable(
      new Table({
        schema: SCHEMA_NAME,
        name: TABLE_NAMES.NOTIFICATIONS,
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'public.uuid_generate_v4()',
          },
          {
            name: 'entry_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'scheduled_at',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'sent_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: Object.values(NotificationStatus),
            isNullable: false,
          },
          {
            name: 'job_id',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
        foreignKeys: [
          new TableForeignKey({
            name: 'FK_notifications_entries',
            columnNames: ['entry_id'],
            referencedColumnNames: ['id'],
            referencedTableName: `${SCHEMA_NAME}.${TABLE_NAMES.ENTRIES}`,
            onDelete: 'CASCADE',
          }),
          new TableForeignKey({
            name: 'FK_notifications_users',
            columnNames: ['user_id'],
            referencedColumnNames: ['id'],
            referencedTableName: `${SCHEMA_NAME}.${TABLE_NAMES.USERS}`,
            onDelete: 'CASCADE',
          }),
        ],
      }),
      true,
    );

    // Email Verification Tokens Table
    await queryRunner.createTable(
      new Table({
        schema: SCHEMA_NAME,
        name: TABLE_NAMES.EMAIL_VERIFICATION_TOKENS,
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'public.uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'token',
            type: 'varchar',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'expires_at',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'used_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
        foreignKeys: [
          new TableForeignKey({
            name: 'FK_email_verification_tokens_users',
            columnNames: ['user_id'],
            referencedColumnNames: ['id'],
            referencedTableName: `${SCHEMA_NAME}.${TABLE_NAMES.USERS}`,
            onDelete: 'CASCADE',
          }),
        ],
      }),
      true,
    );

    // Password Reset Tokens Table
    await queryRunner.createTable(
      new Table({
        schema: SCHEMA_NAME,
        name: TABLE_NAMES.PASSWORD_RESET_TOKENS,
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'public.uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'token',
            type: 'varchar',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'expires_at',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'used_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
        foreignKeys: [
          new TableForeignKey({
            name: 'FK_password_reset_tokens_users',
            columnNames: ['user_id'],
            referencedColumnNames: ['id'],
            referencedTableName: `${SCHEMA_NAME}.${TABLE_NAMES.USERS}`,
            onDelete: 'CASCADE',
          }),
        ],
      }),
      true,
    );
  }

  private async createIndexes(queryRunner: QueryRunner): Promise<void> {
    // Entries Table Indexes
    await queryRunner.createIndex(
      `${SCHEMA_NAME}.${TABLE_NAMES.ENTRIES}`,
      new TableIndex({
        name: 'IDX_entries_user_id',
        columnNames: ['user_id'],
      }),
    );
    await queryRunner.createIndex(
      `${SCHEMA_NAME}.${TABLE_NAMES.ENTRIES}`,
      new TableIndex({
        name: 'IDX_entries_date',
        columnNames: ['date'],
      }),
    );
    await queryRunner.createIndex(
      `${SCHEMA_NAME}.${TABLE_NAMES.ENTRIES}`,
      new TableIndex({
        name: 'IDX_entries_type',
        columnNames: ['type'],
      }),
    );
    await queryRunner.createIndex(
      `${SCHEMA_NAME}.${TABLE_NAMES.ENTRIES}`,
      new TableIndex({
        name: 'IDX_entries_user_date',
        columnNames: ['user_id', 'date'],
      }),
    );
    await queryRunner.createIndex(
      `${SCHEMA_NAME}.${TABLE_NAMES.CATEGORIES}`,
      new TableIndex({
        name: 'IDX_categories_user_id',
        columnNames: ['user_id'],
      }),
    );

    // Email Verification Tokens Table Indexes
    await queryRunner.createIndex(
      `${SCHEMA_NAME}.${TABLE_NAMES.EMAIL_VERIFICATION_TOKENS}`,
      new TableIndex({
        name: 'IDX_email_verification_tokens_user_id',
        columnNames: ['user_id'],
      }),
    );
    await queryRunner.createIndex(
      `${SCHEMA_NAME}.${TABLE_NAMES.EMAIL_VERIFICATION_TOKENS}`,
      new TableIndex({
        name: 'IDX_email_verification_tokens_token',
        columnNames: ['token'],
      }),
    );
    await queryRunner.createIndex(
      `${SCHEMA_NAME}.${TABLE_NAMES.PASSWORD_RESET_TOKENS}`,
      new TableIndex({
        name: 'IDX_password_reset_tokens_user_id',
        columnNames: ['user_id'],
      }),
    );
    await queryRunner.createIndex(
      `${SCHEMA_NAME}.${TABLE_NAMES.PASSWORD_RESET_TOKENS}`,
      new TableIndex({
        name: 'IDX_password_reset_tokens_token',
        columnNames: ['token'],
      }),
    );

    // Notifications Table Indexes
    // Create indices for notifications table
    await queryRunner.createIndex(
      `${SCHEMA_NAME}.${TABLE_NAMES.NOTIFICATIONS}`,
      new TableIndex({
        name: 'IDX_notifications_entry_id',
        columnNames: ['entry_id'],
      }),
    );
    await queryRunner.createIndex(
      `${SCHEMA_NAME}.${TABLE_NAMES.NOTIFICATIONS}`,
      new TableIndex({
        name: 'IDX_notifications_user_id',
        columnNames: ['user_id'],
      }),
    );
    await queryRunner.createIndex(
      `${SCHEMA_NAME}.${TABLE_NAMES.NOTIFICATIONS}`,
      new TableIndex({
        name: 'IDX_notifications_status',
        columnNames: ['status'],
      }),
    );
    await queryRunner.createIndex(
      `${SCHEMA_NAME}.${TABLE_NAMES.NOTIFICATIONS}`,
      new TableIndex({
        name: 'IDX_notifications_scheduled_at',
        columnNames: ['scheduled_at'],
      }),
    );
  }

  private async createTriggers(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION ${SCHEMA_NAME}.update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);

    await queryRunner.query(`
      CREATE TRIGGER update_users_updated_at 
      BEFORE UPDATE ON "${SCHEMA_NAME}"."${TABLE_NAMES.USERS}" 
      FOR EACH ROW EXECUTE FUNCTION ${SCHEMA_NAME}.update_updated_at_column()
    `);

    await queryRunner.query(`
      CREATE TRIGGER update_categories_updated_at 
      BEFORE UPDATE ON "${SCHEMA_NAME}"."${TABLE_NAMES.CATEGORIES}" 
      FOR EACH ROW EXECUTE FUNCTION ${SCHEMA_NAME}.update_updated_at_column()
    `);

    await queryRunner.query(`
      CREATE TRIGGER update_entries_updated_at 
      BEFORE UPDATE ON "${SCHEMA_NAME}"."${TABLE_NAMES.ENTRIES}" 
      FOR EACH ROW EXECUTE FUNCTION ${SCHEMA_NAME}.update_updated_at_column()
    `);
  }
}
