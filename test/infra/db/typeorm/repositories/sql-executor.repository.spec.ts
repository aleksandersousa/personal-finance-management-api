import { TypeormSqlExecutorRepository } from '@/infra/db/typeorm/repositories/sql-executor.repository';

describe('TypeormSqlExecutorRepository', () => {
  it('should run readonly query in a transaction and return rows', async () => {
    const rows = [{ a: 1 }];
    const runner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      query: jest
        .fn()
        .mockResolvedValueOnce(undefined) // SET LOCAL
        .mockResolvedValueOnce(rows),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
    } as any;
    const ds = { createQueryRunner: () => runner } as any;
    const sut = new TypeormSqlExecutorRepository(ds);

    const result = await sut.execute({ sql: 'SELECT 1', params: [] });

    expect(runner.connect).toHaveBeenCalled();
    expect(runner.startTransaction).toHaveBeenCalled();
    expect(runner.query).toHaveBeenNthCalledWith(
      1,
      'SET LOCAL statement_timeout = 3000',
    );
    expect(runner.query).toHaveBeenNthCalledWith(2, 'SELECT 1', []);
    expect(runner.commitTransaction).toHaveBeenCalled();
    expect(runner.release).toHaveBeenCalled();
    expect(result).toEqual(rows as any);
  });

  it('should rollback and rethrow on error, then release', async () => {
    const err = new Error('boom');
    const runner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      query: jest
        .fn()
        .mockResolvedValueOnce(undefined) // SET LOCAL
        .mockRejectedValueOnce(err),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
    } as any;
    const ds = { createQueryRunner: () => runner } as any;
    const sut = new TypeormSqlExecutorRepository(ds);

    await expect(sut.execute({ sql: 'SELECT 1', params: [] })).rejects.toThrow(
      'boom',
    );

    expect(runner.rollbackTransaction).toHaveBeenCalled();
    expect(runner.release).toHaveBeenCalled();
  });
});
