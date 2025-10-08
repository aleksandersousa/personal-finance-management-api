import { DataSource } from 'typeorm';
import { TypeOrmSchemaSnapshotProvider } from '@infra/db/schema/schema-snapshot.provider';

export function makeSchemaSnapshotProvider(dataSource: DataSource) {
  return new TypeOrmSchemaSnapshotProvider(dataSource);
}
