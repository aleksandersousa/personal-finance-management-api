import { SqlApprovedQuery } from '@domain/models/sql-agent.model';

export interface SecureSql {
  execute(input: { rawSql: string; userId: string }): Promise<SqlApprovedQuery>;
}
