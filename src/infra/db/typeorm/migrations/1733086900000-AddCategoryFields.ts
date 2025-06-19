import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCategoryFields1733086900000 implements MigrationInterface {
  name = 'AddCategoryFields1733086900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "categories" 
      ADD COLUMN "description" character varying(255),
      ADD COLUMN "color" character varying(7),
      ADD COLUMN "icon" character varying(50),
      ADD COLUMN "is_default" boolean NOT NULL DEFAULT false
    `);

    await queryRunner.query(`
      ALTER TABLE "categories" 
      ALTER COLUMN "name" TYPE character varying(100)
    `);

    // Create index for better performance on user queries
    await queryRunner.query(`
      CREATE INDEX "IDX_categories_user_id_name" ON "categories" ("user_id", "name")
    `);

    // Create index for type filtering
    await queryRunner.query(`
      CREATE INDEX "IDX_categories_user_id_type" ON "categories" ("user_id", "type")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_categories_user_id_type"`);
    await queryRunner.query(`DROP INDEX "IDX_categories_user_id_name"`);

    // Remove columns
    await queryRunner.query(`
      ALTER TABLE "categories" 
      DROP COLUMN "is_default",
      DROP COLUMN "icon",
      DROP COLUMN "color",
      DROP COLUMN "description"
    `);

    // Revert name column type
    await queryRunner.query(`
      ALTER TABLE "categories" 
      ALTER COLUMN "name" TYPE character varying
    `);
  }
}
