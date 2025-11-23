import { SqlValidatorGuard } from '@/infra/sql/sql-validator.guard';

describe('SqlValidatorGuard - additional branches', () => {
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
