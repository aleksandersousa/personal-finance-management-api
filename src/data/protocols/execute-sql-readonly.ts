import { SqlApprovedQuery, SqlRow } from '@domain/models/sql-agent.model';

export interface ExecuteSqlReadonly {
  execute(input: SqlApprovedQuery): Promise<SqlRow[]>;
}
