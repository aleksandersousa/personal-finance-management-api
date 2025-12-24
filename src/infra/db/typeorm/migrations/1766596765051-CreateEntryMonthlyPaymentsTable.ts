import { SCHEMA_NAME, TABLE_NAMES } from '@/domain/constants';
import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateEntryMonthlyPaymentsTable1766596765051
  implements MigrationInterface
{
  name = 'CreateEntryMonthlyPaymentsTable1766596765051';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create entry_monthly_payments table
    await queryRunner.createTable(
      new Table({
        schema: SCHEMA_NAME,
        name: TABLE_NAMES.ENTRY_MONTHLY_PAYMENTS,
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
            name: 'year',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'month',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'is_paid',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'paid_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create foreign key to entries table
    await queryRunner.createForeignKey(
      `${SCHEMA_NAME}.${TABLE_NAMES.ENTRY_MONTHLY_PAYMENTS}`,
      new TableForeignKey({
        name: `fk_${TABLE_NAMES.ENTRY_MONTHLY_PAYMENTS}_entry`,
        columnNames: ['entry_id'],
        referencedSchema: SCHEMA_NAME,
        referencedTableName: TABLE_NAMES.ENTRIES,
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    // Create unique index on entry_id, year, month
    await queryRunner.createIndex(
      `${SCHEMA_NAME}.${TABLE_NAMES.ENTRY_MONTHLY_PAYMENTS}`,
      new TableIndex({
        name: `idx_${TABLE_NAMES.ENTRY_MONTHLY_PAYMENTS}_entry_year_month`,
        columnNames: ['entry_id', 'year', 'month'],
        isUnique: true,
      }),
    );

    // Create index on entry_id for faster lookups
    await queryRunner.createIndex(
      `${SCHEMA_NAME}.${TABLE_NAMES.ENTRY_MONTHLY_PAYMENTS}`,
      new TableIndex({
        name: `idx_${TABLE_NAMES.ENTRY_MONTHLY_PAYMENTS}_entry_id`,
        columnNames: ['entry_id'],
      }),
    );

    // Create trigger for updated_at
    await queryRunner.query(`
      CREATE TRIGGER update_${TABLE_NAMES.ENTRY_MONTHLY_PAYMENTS}_updated_at
      BEFORE UPDATE ON "${SCHEMA_NAME}"."${TABLE_NAMES.ENTRY_MONTHLY_PAYMENTS}"
      FOR EACH ROW
      EXECUTE FUNCTION ${SCHEMA_NAME}.update_updated_at_column();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop trigger
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS update_${TABLE_NAMES.ENTRY_MONTHLY_PAYMENTS}_updated_at ON "${SCHEMA_NAME}"."${TABLE_NAMES.ENTRY_MONTHLY_PAYMENTS}"`,
    );

    // Drop indexes
    await queryRunner.dropIndex(
      `${SCHEMA_NAME}.${TABLE_NAMES.ENTRY_MONTHLY_PAYMENTS}`,
      `idx_${TABLE_NAMES.ENTRY_MONTHLY_PAYMENTS}_entry_id`,
    );
    await queryRunner.dropIndex(
      `${SCHEMA_NAME}.${TABLE_NAMES.ENTRY_MONTHLY_PAYMENTS}`,
      `idx_${TABLE_NAMES.ENTRY_MONTHLY_PAYMENTS}_entry_year_month`,
    );

    // Drop foreign key
    await queryRunner.dropForeignKey(
      `${SCHEMA_NAME}.${TABLE_NAMES.ENTRY_MONTHLY_PAYMENTS}`,
      `fk_${TABLE_NAMES.ENTRY_MONTHLY_PAYMENTS}_entry`,
    );

    // Drop table
    await queryRunner.dropTable(
      `${SCHEMA_NAME}.${TABLE_NAMES.ENTRY_MONTHLY_PAYMENTS}`,
      true,
    );
  }
}
