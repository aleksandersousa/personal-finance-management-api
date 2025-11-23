import { LocalOrchestrateSqlAnswer } from '@/data/usecases/orchestrate-sql-answer';

describe('LocalOrchestrateSqlAnswer', () => {
  it('should orchestrate: snapshot -> generate -> secure -> execute -> summarize', async () => {
    const schemaSnapshotProvider = {
      getSnapshot: jest.fn().mockResolvedValue('schema'),
    };
    const generateSql = {
      execute: jest
        .fn()
        .mockResolvedValue({ rawSql: 'SELECT 1', model: 'sql' }),
    };
    const approvedQuery = {
      sql: 'SELECT 1 WHERE user_id = $1',
      params: ['user'],
    };
    const secureSql = { execute: jest.fn().mockResolvedValue(approvedQuery) };
    const rows = [{ n: 1 }];
    const executeReadonly = { execute: jest.fn().mockResolvedValue(rows) };
    const summarize = {
      execute: jest.fn().mockResolvedValue({ answer: 'ok' }),
    };

    const sut = new LocalOrchestrateSqlAnswer(
      schemaSnapshotProvider,
      generateSql as any,
      secureSql as any,
      executeReadonly as any,
      summarize as any,
    );

    const result = await sut.execute({
      userId: 'user',
      question: 'quanto tenho que pagar?',
    });

    expect(schemaSnapshotProvider.getSnapshot).toHaveBeenCalled();
    expect(generateSql.execute).toHaveBeenCalledWith({
      schemaSnapshot: 'schema',
      question: { userId: 'user', question: 'quanto tenho que pagar?' },
    });
    expect(secureSql.execute).toHaveBeenCalledWith({
      rawSql: 'SELECT 1',
      userId: 'user',
    });
    expect(executeReadonly.execute).toHaveBeenCalledWith(approvedQuery);
    expect(summarize.execute).toHaveBeenCalledWith({
      question: 'quanto tenho que pagar?',
      rows,
    });

    expect(result).toEqual({ approvedQuery, rows, answer: 'ok' });
  });
});
