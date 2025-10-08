import { DataSource } from 'typeorm';
import { TypeormSqlExecutorRepository } from '@/infra/db/typeorm/repositories/sql-executor.repository';

export function makeSqlExecutor(dataSource: DataSource) {
  return new TypeormSqlExecutorRepository(dataSource);
}
