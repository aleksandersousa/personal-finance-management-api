import { SCHEMA_NAME, TABLE_NAMES } from '@/domain/constants';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class ModernizeDataModel1772000000000 implements MigrationInterface {
  name = 'ModernizeDataModel1772000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM "${SCHEMA_NAME}"."${TABLE_NAMES.CATEGORIES}"
          GROUP BY name
          HAVING COUNT(DISTINCT type) > 1
        ) THEN
          RAISE EXCEPTION 'Cannot enforce unique categories.name: same name exists with multiple types';
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE "${SCHEMA_NAME}"."user_settings" (
        "id" uuid PRIMARY KEY DEFAULT public.uuid_generate_v4(),
        "id_user" uuid NOT NULL UNIQUE,
        "notifications_enabled" boolean NOT NULL DEFAULT false,
        "notifications_time_minutes" integer NOT NULL DEFAULT 30,
        "timezone" varchar NOT NULL DEFAULT 'America/Sao_Paulo',
        "created_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_user_settings_users" FOREIGN KEY ("id_user")
          REFERENCES "${SCHEMA_NAME}"."${TABLE_NAMES.USERS}"("id")
          ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "${SCHEMA_NAME}"."recurrences" (
        "id" uuid PRIMARY KEY DEFAULT public.uuid_generate_v4(),
        "type" varchar NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_recurrences_type"
      ON "${SCHEMA_NAME}"."recurrences" ("type")
    `);

    await queryRunner.query(`
      INSERT INTO "${SCHEMA_NAME}"."recurrences" ("type")
      VALUES ('MONTHLY')
      ON CONFLICT ("type") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "${SCHEMA_NAME}"."user_settings" (
        "id_user",
        "notifications_enabled",
        "notifications_time_minutes",
        "timezone",
        "created_at"
      )
      SELECT
        u."id",
        COALESCE(u."notification_enabled", false),
        COALESCE(u."notification_time_minutes", 30),
        COALESCE(u."timezone", 'America/Sao_Paulo'),
        COALESCE(u."created_at", now())
      FROM "${SCHEMA_NAME}"."${TABLE_NAMES.USERS}" u
      ON CONFLICT ("id_user") DO NOTHING
    `);

    await queryRunner.query(`
      ALTER TABLE "${SCHEMA_NAME}"."${TABLE_NAMES.CATEGORIES}"
      RENAME TO "categories_legacy"
    `);

    await queryRunner.query(`
      CREATE TABLE "${SCHEMA_NAME}"."${TABLE_NAMES.CATEGORIES}" (
        "id" uuid PRIMARY KEY DEFAULT public.uuid_generate_v4(),
        "name" varchar NOT NULL UNIQUE,
        "description" varchar NULL,
        "icon" varchar NULL,
        "color" varchar NULL,
        "type" varchar NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      INSERT INTO "${SCHEMA_NAME}"."${TABLE_NAMES.CATEGORIES}" (
        "name",
        "description",
        "icon",
        "color",
        "type",
        "created_at",
        "updated_at"
      )
      SELECT
        c."name",
        MAX(c."description") AS "description",
        MAX(c."icon") AS "icon",
        MAX(c."color") AS "color",
        c."type"::varchar AS "type",
        MIN(c."created_at") AS "created_at",
        MAX(c."updated_at") AS "updated_at"
      FROM "${SCHEMA_NAME}"."categories_legacy" c
      GROUP BY c."name", c."type"
    `);

    await queryRunner.query(`
      CREATE TABLE "${SCHEMA_NAME}"."user_categories" (
        "id_user" uuid NOT NULL,
        "id_category" uuid NOT NULL,
        CONSTRAINT "PK_user_categories" PRIMARY KEY ("id_user", "id_category"),
        CONSTRAINT "FK_user_categories_user" FOREIGN KEY ("id_user")
          REFERENCES "${SCHEMA_NAME}"."${TABLE_NAMES.USERS}"("id")
          ON DELETE CASCADE,
        CONSTRAINT "FK_user_categories_category" FOREIGN KEY ("id_category")
          REFERENCES "${SCHEMA_NAME}"."${TABLE_NAMES.CATEGORIES}"("id")
          ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      INSERT INTO "${SCHEMA_NAME}"."user_categories" ("id_user", "id_category")
      SELECT DISTINCT
        cl."user_id" AS "id_user",
        c."id" AS "id_category"
      FROM "${SCHEMA_NAME}"."categories_legacy" cl
      INNER JOIN "${SCHEMA_NAME}"."${TABLE_NAMES.CATEGORIES}" c
        ON c."name" = cl."name"
       AND c."type" = cl."type"::varchar
      WHERE cl."user_id" IS NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "${SCHEMA_NAME}"."${TABLE_NAMES.ENTRIES}"
      RENAME TO "entries_legacy"
    `);

    await queryRunner.query(`
      CREATE TABLE "${SCHEMA_NAME}"."${TABLE_NAMES.ENTRIES}" (
        "id" uuid PRIMARY KEY,
        "id_recurrence" uuid NULL,
        "id_user" uuid NOT NULL,
        "id_category" uuid NULL,
        "description" varchar NOT NULL,
        "amount" bigint NOT NULL,
        "issue_date" date NOT NULL,
        "due_date" timestamp NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_entries_recurrences" FOREIGN KEY ("id_recurrence")
          REFERENCES "${SCHEMA_NAME}"."recurrences"("id")
          ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      INSERT INTO "${SCHEMA_NAME}"."${TABLE_NAMES.ENTRIES}" (
        "id",
        "id_recurrence",
        "id_user",
        "id_category",
        "description",
        "amount",
        "issue_date",
        "due_date",
        "created_at",
        "updated_at"
      )
      SELECT
        e."id",
        CASE WHEN e."is_fixed" = true THEN r."id" ELSE NULL END AS "id_recurrence",
        e."user_id" AS "id_user",
        c_new."id" AS "id_category",
        e."description",
        ROUND((e."amount"::numeric) * 100)::bigint AS "amount",
        e."date"::date AS "issue_date",
        e."date"::timestamp AS "due_date",
        COALESCE(e."created_at", now()) AS "created_at",
        COALESCE(e."updated_at", now()) AS "updated_at"
      FROM "${SCHEMA_NAME}"."entries_legacy" e
      INNER JOIN "${SCHEMA_NAME}"."${TABLE_NAMES.USERS}" u
        ON u."id" = e."user_id"
      LEFT JOIN "${SCHEMA_NAME}"."categories_legacy" c_legacy
        ON c_legacy."id" = e."category_id"
      LEFT JOIN "${SCHEMA_NAME}"."${TABLE_NAMES.CATEGORIES}" c_new
        ON c_new."name" = c_legacy."name"
       AND c_new."type" = c_legacy."type"::varchar
      INNER JOIN "${SCHEMA_NAME}"."recurrences" r
        ON r."type" = 'MONTHLY'
    `);

    await queryRunner.query(`
      ALTER TABLE "${SCHEMA_NAME}"."${TABLE_NAMES.ENTRIES}"
      ADD CONSTRAINT "FK_entries_user_categories"
      FOREIGN KEY ("id_user", "id_category")
      REFERENCES "${SCHEMA_NAME}"."user_categories"("id_user", "id_category")
      ON DELETE RESTRICT
    `);

    await queryRunner.query(`
      CREATE TABLE "${SCHEMA_NAME}"."payment" (
        "id" uuid PRIMARY KEY DEFAULT public.uuid_generate_v4(),
        "id_entry" uuid NOT NULL UNIQUE,
        "amount" bigint NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_payment_entries" FOREIGN KEY ("id_entry")
          REFERENCES "${SCHEMA_NAME}"."${TABLE_NAMES.ENTRIES}"("id")
          ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF to_regclass('"${SCHEMA_NAME}"."${TABLE_NAMES.ENTRY_MONTHLY_PAYMENTS}"') IS NOT NULL THEN
          UPDATE "${SCHEMA_NAME}"."entries_legacy" e
          SET "is_paid" = true
          FROM "${SCHEMA_NAME}"."${TABLE_NAMES.ENTRY_MONTHLY_PAYMENTS}" emp
          WHERE emp."entry_id" = e."id"
            AND emp."is_paid" = true
            AND COALESCE(e."is_paid", false) = false;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      INSERT INTO "${SCHEMA_NAME}"."payment" ("id_entry", "amount", "created_at")
      SELECT
        e_new."id",
        e_new."amount",
        COALESCE(e_legacy."updated_at", e_legacy."created_at", now()) AS "created_at"
      FROM "${SCHEMA_NAME}"."entries_legacy" e_legacy
      INNER JOIN "${SCHEMA_NAME}"."${TABLE_NAMES.ENTRIES}" e_new
        ON e_new."id" = e_legacy."id"
      WHERE e_legacy."is_paid" = true
    `);

    await queryRunner.query(`
      DO $$
      DECLARE inconsistent_count bigint;
      BEGIN
        IF to_regclass('"${SCHEMA_NAME}"."${TABLE_NAMES.ENTRY_MONTHLY_PAYMENTS}"') IS NOT NULL THEN
          SELECT COUNT(1)
          INTO inconsistent_count
          FROM "${SCHEMA_NAME}"."${TABLE_NAMES.ENTRY_MONTHLY_PAYMENTS}" emp
          INNER JOIN "${SCHEMA_NAME}"."entries_legacy" e
            ON e."id" = emp."entry_id"
          WHERE emp."is_paid" = true AND COALESCE(e."is_paid", false) = false;

          IF inconsistent_count > 0 THEN
            RAISE EXCEPTION 'Inconsistent monthly payment state found for % rows in entry_monthly_payments', inconsistent_count;
          END IF;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "${SCHEMA_NAME}"."${TABLE_NAMES.NOTIFICATIONS}"
      RENAME TO "notifications_legacy"
    `);

    await queryRunner.query(`
      CREATE TABLE "${SCHEMA_NAME}"."${TABLE_NAMES.NOTIFICATIONS}" (
        "id" uuid PRIMARY KEY DEFAULT public.uuid_generate_v4(),
        "id_user" uuid NOT NULL,
        "id_entry" uuid NOT NULL,
        "job_id" varchar NULL,
        "status" varchar NOT NULL,
        "scheduled_at" timestamp NOT NULL,
        "sent_at" timestamp NULL,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_notifications_users" FOREIGN KEY ("id_user")
          REFERENCES "${SCHEMA_NAME}"."${TABLE_NAMES.USERS}"("id")
          ON DELETE CASCADE,
        CONSTRAINT "FK_notifications_entries" FOREIGN KEY ("id_entry")
          REFERENCES "${SCHEMA_NAME}"."${TABLE_NAMES.ENTRIES}"("id")
          ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      INSERT INTO "${SCHEMA_NAME}"."${TABLE_NAMES.NOTIFICATIONS}" (
        "id",
        "id_user",
        "id_entry",
        "job_id",
        "status",
        "scheduled_at",
        "sent_at",
        "created_at",
        "updated_at"
      )
      SELECT
        n."id",
        n."user_id" AS "id_user",
        n."entry_id" AS "id_entry",
        COALESCE(n."job_id", n."id"::varchar) AS "job_id",
        n."status"::varchar AS "status",
        n."scheduled_at",
        n."sent_at" AS "sent_at",
        COALESCE(n."created_at", now()) AS "created_at",
        COALESCE(n."updated_at", now()) AS "updated_at"
      FROM "${SCHEMA_NAME}"."notifications_legacy" n
    `);

    await queryRunner.query(`
      ALTER TABLE "${SCHEMA_NAME}"."${TABLE_NAMES.EMAIL_VERIFICATION_TOKENS}"
      RENAME COLUMN "user_id" TO "id_user"
    `);

    await queryRunner.query(`
      ALTER TABLE "${SCHEMA_NAME}"."${TABLE_NAMES.PASSWORD_RESET_TOKENS}"
      RENAME COLUMN "user_id" TO "id_user"
    `);

    await queryRunner.query(`
      ALTER TABLE "${SCHEMA_NAME}"."${TABLE_NAMES.USERS}"
      DROP COLUMN "notification_enabled",
      DROP COLUMN "notification_time_minutes",
      DROP COLUMN "timezone"
    `);

    await queryRunner.query(`
      DROP TABLE "${SCHEMA_NAME}"."notifications_legacy"
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS "${SCHEMA_NAME}"."${TABLE_NAMES.ENTRY_MONTHLY_PAYMENTS}"
    `);

    await queryRunner.query(`
      DROP TABLE "${SCHEMA_NAME}"."entries_legacy"
    `);

    await queryRunner.query(`
      DROP TABLE "${SCHEMA_NAME}"."categories_legacy"
    `);
  }

  public async down(): Promise<void> {
    throw new Error(
      'Down migration is not supported for ModernizeDataModel1772000000000',
    );
  }
}
