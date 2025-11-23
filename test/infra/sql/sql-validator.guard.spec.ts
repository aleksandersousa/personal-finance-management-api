import { SqlValidatorGuard } from '@/infra/sql/sql-validator.guard';

describe('SqlValidatorGuard', () => {
  const sut = new SqlValidatorGuard();

  it('rejects non-SELECT', async () => {
    await expect(
      sut.execute({ rawSql: 'DELETE FROM entries', userId: 'u' }),
    ).rejects.toThrow('Apenas SELECT é permitido');
  });

  it('denies dangerous commands', async () => {
    await expect(
      sut.execute({
        rawSql: 'SELECT * FROM users; DROP TABLE users',
        userId: 'u',
      }),
    ).rejects.toThrow('Comando SQL não permitido');
    await expect(
      sut.execute({ rawSql: 'SELECT * FROM users; ', userId: 'u' }),
    ).rejects.toThrow('Múltiplas instruções não permitidas');
  });

  it('scopes queries to user_id and adds limit', async () => {
    const res = await sut.execute({
      rawSql: 'SELECT * FROM entries',
      userId: 'user-1',
    });
    expect(res.sql.toLowerCase()).toContain('where user_id = ?');
    expect(res.params).toEqual(['user-1']);
    expect(res.sql.toLowerCase()).toContain('limit 200');
  });

  it('preserves existing where by adding AND scope', async () => {
    const res = await sut.execute({
      rawSql: 'SELECT * FROM entries WHERE paid = false',
      userId: 'user-1',
    });
    expect(res.sql.toLowerCase()).toContain('where user_id = ? and');
  });

  it('should inject user filter before GROUP BY and add LIMIT', async () => {
    const sut = new SqlValidatorGuard();
    const res = await sut.execute({
      rawSql: 'SELECT user_id, count(*) FROM entries GROUP BY user_id',
      userId: 'u1',
    });
    expect(res.sql).toMatch(/WHERE user_id = \? GROUP BY/);
    expect(res.sql).toMatch(/LIMIT 200$/);
    expect(res.params).toEqual(['u1']);
  });

  it('should inject user filter before ORDER BY when missing WHERE', async () => {
    const sut = new SqlValidatorGuard();
    const res = await sut.execute({
      rawSql: 'SELECT * FROM categories ORDER BY name ASC',
      userId: 'u2',
    });
    expect(res.sql).toMatch(/WHERE user_id = \? ORDER BY name ASC LIMIT 200$/);
    expect(res.params).toEqual(['u2']);
  });
});
