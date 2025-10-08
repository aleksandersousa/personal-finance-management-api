import { OrchestrateSqlAnswer } from '@/domain/usecases/orchestrate-sql-answer';
import { GenerateSql } from '@/data/protocols/generate-sql';
import { SecureSql } from '@/data/protocols/secure-sql';
import { ExecuteSqlReadonly } from '@/data/protocols/execute-sql-readonly';
import { SummarizeResults } from '@/data/protocols/summarize-results';
import { SqlAnswer } from '@domain/models/sql-agent.model';

export class LocalOrchestrateSqlAnswer implements OrchestrateSqlAnswer {
  constructor(
    private readonly schemaSnapshotProvider: {
      getSnapshot: () => Promise<string>;
    },
    private readonly generateSql: GenerateSql,
    private readonly secureSql: SecureSql,
    private readonly executeReadonly: ExecuteSqlReadonly,
    private readonly summarize: SummarizeResults,
  ) {}

  async execute(input: {
    userId: string;
    question: string;
  }): Promise<SqlAnswer> {
    const schemaSnapshot = await this.schemaSnapshotProvider.getSnapshot();
    const gen = await this.generateSql.execute({
      schemaSnapshot,
      question: { userId: input.userId, question: input.question },
    });
    const approved = await this.secureSql.execute({
      rawSql: gen.rawSql,
      userId: input.userId,
    });
    const rows = await this.executeReadonly.execute(approved);
    const summary = await this.summarize.execute({
      question: input.question,
      rows,
    });
    const answer: SqlAnswer = {
      approvedQuery: approved,
      rows,
      answer: summary.answer,
    };
    return answer;
  }
}
