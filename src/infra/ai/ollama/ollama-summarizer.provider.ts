import { SummarizeResults } from '@/data/protocols';
import { SqlRow } from '@domain/models/sql-agent.model';

export class OllamaSummarizerProvider implements SummarizeResults {
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
    question: string;
    rows: SqlRow[];
  }): Promise<{ answer: string }> {
    const preview = JSON.stringify(input.rows.slice(0, 50));
    const system =
      'Resuma resultados de consulta SQL de forma concisa, factual e contextual ao usuário.';

    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: system },
          {
            role: 'user',
            content: `Pergunta: ${input.question}\nDados (amostra): ${preview}`,
          },
        ],
        stream: false,
      }),
    });

    if (!res.ok) {
      throw new Error(`Ollama error: ${res.status} ${res.statusText}`);
    }
    const json: any = await res.json();
    const answer: string = json?.message?.content || json?.content || '';
    return { answer };
  }
}
