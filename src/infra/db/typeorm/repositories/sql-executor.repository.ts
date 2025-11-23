import { ExecuteSqlReadonly } from '@/data/protocols';
import { SqlApprovedQuery, SqlRow } from '@domain/models/sql-agent.model';
import { DataSource } from 'typeorm';

export class TypeormSqlExecutorRepository implements ExecuteSqlReadonly {
  constructor(private readonly dataSource: DataSource) {}

  async execute(input: SqlApprovedQuery): Promise<SqlRow[]> {
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    try {
      await runner.startTransaction();
      await runner.query('SET LOCAL statement_timeout = 3000');
      const result = await runner.query(input.sql, input.params);
      await runner.commitTransaction();
      return result as unknown as SqlRow[];
    } catch (error) {
      try {
        await runner.rollbackTransaction();
      } catch {}
      throw error;
    } finally {
      await runner.release();
    }
  }
}
