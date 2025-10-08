import { SecureSql } from '@/data/protocols';
import { SqlApprovedQuery } from '@domain/models/sql-agent.model';

export class SqlValidatorGuard implements SecureSql {
  async execute(input: {
    rawSql: string;
    userId: string;
  }): Promise<SqlApprovedQuery> {
    const normalized = input.rawSql.trim().replace(/\s+/g, ' ');

    if (!/^select\b/i.test(normalized)) {
      throw new Error('Apenas SELECT é permitido');
    }

    const deny =
      /(insert|update|delete|alter|drop|truncate|grant|create|copy|call|execute|function|sequence|trigger|vacuum|analyze|show|set|do)\b/i;
    if (deny.test(normalized)) {
      throw new Error('Comando SQL não permitido');
    }

    if (normalized.includes(';')) {
      throw new Error('Múltiplas instruções não permitidas');
    }

    let scoped = normalized;
    const targets = /(\bentries\b|\bcategories\b|\bforecasts\b|\busers\b)/i;
    const hasWhere = /\bwhere\b/i.test(scoped);
    const hasScope = /user_id\s*=\s*:?userId\b/i.test(scoped);
    if (targets.test(scoped) && !hasScope) {
      if (hasWhere) {
        scoped = scoped.replace(/\bwhere\b/i, 'WHERE user_id = :userId AND ');
      } else if (/\bgroup by\b/i.test(scoped)) {
        scoped = scoped.replace(
          /\bgroup by\b/i,
          'WHERE user_id = :userId GROUP BY',
        );
      } else if (/\border by\b/i.test(scoped)) {
        scoped = scoped.replace(
          /\border by\b/i,
          'WHERE user_id = :userId ORDER BY',
        );
      } else {
        scoped = scoped + ' WHERE user_id = :userId';
      }
    }

    if (!/\blimit\s+\d+\b/i.test(scoped)) {
      scoped = scoped + ' LIMIT 200';
    }

    // Convert positional params for TypeORM query([...]) usage
    // Replace :userId with $1-like? TypeORM supports array params with positional markers (?).
    const sqlWithMarker = scoped.replace(/:userId\b/g, '?');
    const params = [input.userId];
    return { sql: sqlWithMarker, params };
  }
}
