import { AppDataSource } from '../config/data-source';
import { SCHEMA_NAME, TABLE_NAMES } from '@/domain/constants';

export async function seedRecurrences(): Promise<void> {
  await AppDataSource.query(
    `
    INSERT INTO "${SCHEMA_NAME}"."${TABLE_NAMES.RECURRENCES}" ("type")
    VALUES ($1)
    ON CONFLICT ("type") DO NOTHING
    `,
    ['MONTHLY'],
  );
}
