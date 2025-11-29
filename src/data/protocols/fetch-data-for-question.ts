import { SqlRow } from '@domain/models/sql-agent.model';

export interface FetchDataForQuestion {
  execute(input: {
    question: string;
    userId: string;
  }): Promise<{ result: SqlRow[] }>;
}
