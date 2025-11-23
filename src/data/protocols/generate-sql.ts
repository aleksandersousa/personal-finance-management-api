import { SqlQuestion } from '@domain/models/sql-agent.model';

export interface GenerateSql {
  execute(input: {
    schemaSnapshot: string;
    question: SqlQuestion;
  }): Promise<{ rawSql: string }>;
}
