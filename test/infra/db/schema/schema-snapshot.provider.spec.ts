import { TypeOrmSchemaSnapshotProvider } from '@/infra/db/schema/schema-snapshot.provider';

describe('TypeOrmSchemaSnapshotProvider', () => {
  it('should format tables, columns and relations', async () => {
    const ds: any = {
      entityMetadatas: [
        {
          tableName: 'categories',
          columns: [
            { databaseName: 'id', type: 'uuid', isNullable: false },
            { databaseName: 'name', type: 'varchar', isNullable: false },
            { databaseName: 'note', type: 'text', isNullable: true },
          ],
          relations: [
            {
              propertyName: 'entries',
              inverseEntityMetadata: { tableName: 'entries' },
              relationType: 'one-to-many',
            },
          ],
        },
        {
          tableName: 'entries',
          columns: [
            { databaseName: 'id', type: 'uuid', isNullable: false },
            { databaseName: 'category_id', type: 'uuid', isNullable: true },
          ],
          relations: [],
        },
      ],
    };

    const sut = new TypeOrmSchemaSnapshotProvider(ds);
    const snapshot = await sut.getSnapshot();

    expect(snapshot).toContain('Table categories:');
    expect(snapshot).toContain('- id: uuid');
    expect(snapshot).toContain('- note: text nullable');
    expect(snapshot).toContain('Relations:');
    expect(snapshot).toContain('- entries -> entries (one-to-many)');
    expect(snapshot).toContain('Table entries:');
    expect(snapshot).toContain('- category_id: uuid nullable');
  });
});
