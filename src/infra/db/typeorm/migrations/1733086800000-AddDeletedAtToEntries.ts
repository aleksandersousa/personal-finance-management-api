import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDeletedAtToEntries1733086800000 implements MigrationInterface {
  name = 'AddDeletedAtToEntries1733086800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'entries',
      new TableColumn({
        name: 'deleted_at',
        type: 'timestamp',
        isNullable: true,
        default: null,
      }),
    );

    // Add index for performance on queries that filter out deleted entries
    await queryRunner.query(`
      CREATE INDEX IDX_entries_deleted_at ON entries(deleted_at)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index first
    await queryRunner.query(`DROP INDEX IDX_entries_deleted_at`);

    // Drop column
    await queryRunner.dropColumn('entries', 'deleted_at');
  }
}
