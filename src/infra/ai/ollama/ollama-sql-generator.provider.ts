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
      'Regras: somente SELECT; sem DDL/DML; sempre filtrar por user_id quando aplicável; usar LIMIT quando necessário.',
      'Formato: um único bloco ```sql ... ```.',
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
    return match ? match[1].trim() : null;
  }
}
