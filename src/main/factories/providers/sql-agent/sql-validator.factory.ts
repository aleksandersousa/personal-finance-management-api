import { SqlValidatorGuard } from '@infra/sql/sql-validator.guard';

export function makeSqlValidator() {
  return new SqlValidatorGuard();
}
