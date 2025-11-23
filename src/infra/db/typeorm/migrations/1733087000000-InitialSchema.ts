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
    // 1. Create Schema and Extensions
    await queryRunner.createSchema('financial', true);
    await queryRunner.query(
      `CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA "public"`,
    );
    await queryRunner.query(
      `CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA "public"`,
    );

    // 2. Create Users Table
    await queryRunner.createTable(
      new Table({
        schema: 'financial',
        name: 'users',
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

    // 3. Create Categories Table
    await queryRunner.createTable(
      new Table({
        schema: 'financial',
        name: 'categories',
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
            name: 'description',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'icon',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'color',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'varchar',
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
        ],
        foreignKeys: [
          new TableForeignKey({
            name: 'FK_categories_users',
            columnNames: ['user_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'financial.users',
            onDelete: 'CASCADE',
          }),
        ],
      }),
      true,
    );

    // 4. Create Entries Table
    await queryRunner.createTable(
      new Table({
        schema: 'financial',
        name: 'entries',
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
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'is_fixed',
            type: 'boolean',
            default: false,
            isNullable: false,
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
            referencedTableName: 'financial.users',
            onDelete: 'CASCADE',
          }),
          new TableForeignKey({
            name: 'FK_entries_categories',
            columnNames: ['category_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'financial.categories',
            onDelete: 'SET NULL',
          }),
        ],
      }),
      true,
    );

    // 5. Create Indices
    await queryRunner.createIndex(
      'financial.entries',
      new TableIndex({
        name: 'IDX_entries_user_id',
        columnNames: ['user_id'],
      }),
    );
    await queryRunner.createIndex(
      'financial.entries',
      new TableIndex({
        name: 'IDX_entries_date',
        columnNames: ['date'],
      }),
    );
    await queryRunner.createIndex(
      'financial.entries',
      new TableIndex({
        name: 'IDX_entries_type',
        columnNames: ['type'],
      }),
    );
    await queryRunner.createIndex(
      'financial.entries',
      new TableIndex({
        name: 'IDX_entries_user_date',
        columnNames: ['user_id', 'date'],
      }),
    );
    await queryRunner.createIndex(
      'financial.categories',
      new TableIndex({
        name: 'IDX_categories_user_id',
        columnNames: ['user_id'],
      }),
    );

    // 6. Create Updated At Trigger Function (in public schema to be reusable)
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION public.update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);

    // 7. Apply Triggers
    await queryRunner.query(`
      CREATE TRIGGER update_users_updated_at 
      BEFORE UPDATE ON "financial"."users" 
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()
    `);

    await queryRunner.query(`
      CREATE TRIGGER update_categories_updated_at 
      BEFORE UPDATE ON "financial"."categories" 
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()
    `);

    await queryRunner.query(`
      CREATE TRIGGER update_entries_updated_at 
      BEFORE UPDATE ON "financial"."entries" 
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop Triggers
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS update_entries_updated_at ON "financial"."entries"`,
    );
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS update_categories_updated_at ON "financial"."categories"`,
    );
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS update_users_updated_at ON "financial"."users"`,
    );

    // Drop Tables (respect FK order)
    await queryRunner.dropTable('financial.entries', true);
    await queryRunner.dropTable('financial.categories', true);
    await queryRunner.dropTable('financial.users', true);

    // Drop Schema
    await queryRunner.dropSchema('financial', true);
  }
}
