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
    const hasScope =
      /user_id\s*=\s*:?userId\b/i.test(scoped) ||
      /user_id\s*=\s*\$\d+/i.test(scoped);

    if (targets.test(scoped) && !hasScope) {
      if (hasWhere) {
        // Adiciona user_id = :userId AND antes da condição WHERE existente
        scoped = scoped.replace(/\bwhere\b/i, 'WHERE user_id = :userId AND ');
      } else if (/\bgroup by\b/i.test(scoped)) {
        // Adiciona WHERE user_id = :userId antes do GROUP BY
        scoped = scoped.replace(
          /\bgroup by\b/i,
          'WHERE user_id = :userId GROUP BY',
        );
      } else if (/\border by\b/i.test(scoped)) {
        // Adiciona WHERE user_id = :userId antes do ORDER BY
        scoped = scoped.replace(
          /\border by\b/i,
          'WHERE user_id = :userId ORDER BY',
        );
      } else {
        // Adiciona WHERE user_id = :userId no final
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

    // Validação adicional de sintaxe SQL básica
    this.validateBasicSqlSyntax(sqlWithMarker);

    return { sql: sqlWithMarker, params };
  }

  private validateBasicSqlSyntax(sql: string): void {
    // Verifica se há parênteses balanceados
    const openParens = (sql.match(/\(/g) || []).length;
    const closeParens = (sql.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      throw new Error('Parênteses não balanceados na consulta SQL');
    }

    // Verifica se há aspas não fechadas
    const singleQuotes = (sql.match(/'/g) || []).length;
    if (singleQuotes % 2 !== 0) {
      throw new Error('Aspas simples não fechadas na consulta SQL');
    }

    const doubleQuotes = (sql.match(/"/g) || []).length;
    if (doubleQuotes % 2 !== 0) {
      throw new Error('Aspas duplas não fechadas na consulta SQL');
    }

    // Verifica se há palavras-chave SQL malformadas
    const malformedKeywords =
      /(select\s+select|from\s+from|where\s+where|group\s+group|order\s+order)/i;
    if (malformedKeywords.test(sql)) {
      throw new Error('Palavras-chave SQL duplicadas ou malformadas');
    }

    // Verifica se há vírgulas duplas ou mal posicionadas
    const doubleCommas = /,\s*,/;
    if (doubleCommas.test(sql)) {
      throw new Error('Vírgulas duplas na consulta SQL');
    }

    // Verifica se há operadores malformados
    const malformedOperators = /(=\s*=|<\s*>|>\s*<)/;
    if (malformedOperators.test(sql)) {
      throw new Error('Operadores malformados na consulta SQL');
    }
  }
}
