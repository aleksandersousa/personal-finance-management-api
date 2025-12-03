import { AgentBasedOrchestrateSqlAnswer } from '@/data/usecases';
import { FetchDataForQuestion, SummarizeResults } from '@/data/protocols';
import { SqlRow } from '@domain/models';

describe('AgentBasedOrchestrateSqlAnswer', () => {
  let sut: AgentBasedOrchestrateSqlAnswer;
  let fetchDataForQuestion: jest.Mocked<FetchDataForQuestion>;
  let summarize: jest.Mocked<SummarizeResults>;

  beforeEach(() => {
    fetchDataForQuestion = {
      execute: jest.fn(),
    };

    summarize = {
      execute: jest.fn(),
    };

    sut = new AgentBasedOrchestrateSqlAnswer(fetchDataForQuestion, summarize);
  });

  it('should orchestrate: fetch data from agent -> summarize', async () => {
    // Arrange
    const userId = 'user-123';
    const question = 'Quanto gastei este mês?';
    const rows: SqlRow[] = [
      { category: 'Food', total: 500 },
      { category: 'Transport', total: 200 },
    ];
    const summaryText =
      'Você gastou R$ 700 este mês: R$ 500 em comida e R$ 200 em transporte.';

    fetchDataForQuestion.execute.mockResolvedValue({ result: rows });
    summarize.execute.mockResolvedValue({ answer: summaryText });

    // Act
    const result = await sut.execute({ userId, question });

    // Assert
    expect(fetchDataForQuestion.execute).toHaveBeenCalledWith({
      question,
      userId,
    });

    expect(summarize.execute).toHaveBeenCalledWith({
      question,
      rows,
    });

    expect(result).toEqual({
      approvedQuery: {
        sql: 'Query executed via API',
        params: [],
      },
      rows,
      answer: summaryText,
    });
  });

  it('should handle empty results from agent', async () => {
    // Arrange
    const userId = 'user-456';
    const question = 'Tenho despesas futuras?';
    const rows: SqlRow[] = [];
    const summaryText = 'Você não possui despesas futuras registradas.';

    fetchDataForQuestion.execute.mockResolvedValue({ result: rows });
    summarize.execute.mockResolvedValue({ answer: summaryText });

    // Act
    const result = await sut.execute({ userId, question });

    // Assert
    expect(result.rows).toEqual([]);
    expect(result.answer).toBe(summaryText);
  });

  it('should propagate errors from fetch data agent', async () => {
    // Arrange
    const userId = 'user-789';
    const question = 'Qual meu saldo?';
    const error = new Error('Agent failed to select endpoint');

    fetchDataForQuestion.execute.mockRejectedValue(error);

    // Act & Assert
    await expect(sut.execute({ userId, question })).rejects.toThrow(
      'Agent failed to select endpoint',
    );

    expect(summarize.execute).not.toHaveBeenCalled();
  });

  it('should propagate errors from summarizer', async () => {
    // Arrange
    const userId = 'user-101';
    const question = 'Resumo de gastos';
    const rows: SqlRow[] = [{ total: 1000 }];
    const error = new Error('Gemini API rate limit exceeded');

    fetchDataForQuestion.execute.mockResolvedValue({ result: rows });
    summarize.execute.mockRejectedValue(error);

    // Act & Assert
    await expect(sut.execute({ userId, question })).rejects.toThrow(
      'Gemini API rate limit exceeded',
    );
  });

  it('should handle complex data structures from agent', async () => {
    // Arrange
    const userId = 'user-202';
    const question = 'Análise detalhada de gastos';
    const rows: SqlRow[] = [
      {
        month: '2024-01',
        categories: ['Food', 'Transport'],
        total: 700,
        average: 350,
      },
      {
        month: '2024-02',
        categories: ['Food', 'Entertainment'],
        total: 850,
        average: 425,
      },
    ];
    const summaryText =
      'Análise dos últimos 2 meses mostra um aumento de 21% nos gastos.';

    fetchDataForQuestion.execute.mockResolvedValue({ result: rows });
    summarize.execute.mockResolvedValue({ answer: summaryText });

    // Act
    const result = await sut.execute({ userId, question });

    // Assert
    expect(result.rows).toEqual(rows);
    expect(result.answer).toBe(summaryText);
    expect(result.approvedQuery.sql).toBe('Query executed via API');
  });
});
