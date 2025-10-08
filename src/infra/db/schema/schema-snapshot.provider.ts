import type { SchemaSnapshotProvider } from '@/data/protocols';
import { DataSource } from 'typeorm';

export class TypeOrmSchemaSnapshotProvider implements SchemaSnapshotProvider {
  constructor(private readonly dataSource: DataSource) {}

  async getSnapshot(): Promise<string> {
    const lines: string[] = [];
    for (const meta of this.dataSource.entityMetadatas) {
      lines.push(`Table ${meta.tableName}:`);
      for (const c of meta.columns) {
        lines.push(
          `- ${c.databaseName}: ${String(c.type)}${c.isNullable ? ' nullable' : ''}`,
        );
      }
      if (meta.relations.length) {
        lines.push('Relations:');
        for (const r of meta.relations) {
          lines.push(
            `- ${r.propertyName} -> ${r.inverseEntityMetadata.tableName} (${r.relationType})`,
          );
        }
      }
      lines.push('');
    }
    return lines.join('\n');
  }
}
