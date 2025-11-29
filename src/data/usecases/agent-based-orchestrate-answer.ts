import { OrchestrateSqlAnswer } from '@/domain/usecases/orchestrate-sql-answer';
import { SummarizeResults } from '@/data/protocols/summarize-results';
import { SqlAnswer } from '@domain/models/sql-agent.model';
import { FetchDataForQuestion } from '@data/protocols';

export class AgentBasedOrchestrateSqlAnswer implements OrchestrateSqlAnswer {
  constructor(
    private readonly fetchDataForQuestion: FetchDataForQuestion,
    private readonly summarize: SummarizeResults,
  ) {}

  async execute(input: {
    userId: string;
    question: string;
  }): Promise<SqlAnswer> {
    const { result: rows } = await this.fetchDataForQuestion.execute({
      question: input.question,
      userId: input.userId,
    });

    const summary = await this.summarize.execute({
      question: input.question,
      rows,
    });

    const answer: SqlAnswer = {
      approvedQuery: {
        sql: 'Query executed via API',
        params: [],
      },
      rows,
      answer: summary.answer,
    };

    return answer;
  }
}
