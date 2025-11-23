import { SqlRow } from '@domain/models/sql-agent.model';

export interface SummarizeResults {
  execute(input: {
    question: string;
    rows: SqlRow[];
  }): Promise<{ answer: string }>;
}
