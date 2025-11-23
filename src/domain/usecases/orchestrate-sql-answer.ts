import { SqlAnswer } from '@domain/models/sql-agent.model';

export interface OrchestrateSqlAnswer {
  execute(input: { userId: string; question: string }): Promise<SqlAnswer>;
}
