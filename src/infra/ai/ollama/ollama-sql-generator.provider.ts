import { GenerateSql } from '@/data/protocols';

export class OllamaSqlGeneratorProvider implements GenerateSql {
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(params?: { baseUrl?: string; model?: string }) {
    this.baseUrl =
      params?.baseUrl ||
      process.env.OLLAMA_BASE_URL ||
      'http://localhost:11434';
    this.model = params?.model || process.env.OLLAMA_MODEL || 'llama3.1';
  }

  async execute(input: {
    schemaSnapshot: string;
    question: { userId: string; question: string };
  }): Promise<{ rawSql: string }> {
    const system = [
      'Você é um especialista em PostgreSQL.',
      'Gere apenas UMA consulta SQL válida e segura.',
      'Regras:',
      '- Apenas comandos SELECT são permitidos',
      '- Sem DDL/DML (CREATE, DROP, ALTER, INSERT, UPDATE, DELETE)',
      '- Sem ponto e vírgula (;) no final',
      '- Sem múltiplas instruções',
      '- Semparênteses balanceados e aspas fechadas',
      '- Sem vírgulas duplas ou operadores malformados',
      '- Sempre filtrar por user_id quando aplicável',
      '- Usar LIMIT quando necessário para evitar resultados muito grandes',
      '- Usar nomes de colunas e tabelas exatos do schema',
      '- Formato: um único bloco ```sql ... ``` sem ponto e vírgula',
      'Schema:',
      input.schemaSnapshot,
    ].join('\n');

    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: input.question.question },
        ],
        stream: false,
      }),
    });

    if (!res.ok) {
      throw new Error(`Ollama error: ${res.status} ${res.statusText}`);
    }
    const json: any = await res.json();
    const content: string = json?.message?.content || json?.content || '';
    const rawSql = this.extractSql(content);
    if (!rawSql) {
      throw new Error('Falha ao extrair SQL do conteúdo do modelo.');
    }
    return { rawSql };
  }

  private extractSql(text: string): string | null {
    const match =
      text.match(/```sql\s*([\s\S]*?)```/i) || text.match(/```([\s\S]*?)```/i);
    if (!match) {
      return null;
    }

    let sql = match[1].trim();

    // Remove ponto e vírgula do final se existir
    sql = sql.replace(/;+\s*$/, '');

    // Remove espaços extras e quebras de linha desnecessárias
    sql = sql.replace(/\s+/g, ' ').trim();

    // Valida se é uma consulta SELECT válida
    if (!/^select\b/i.test(sql)) {
      return null;
    }

    return sql;
  }
}
