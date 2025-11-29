import { SummarizeResults } from '@/data/protocols';
import { SqlRow } from '@domain/models/sql-agent.model';

export class GeminiSummarizerProvider implements SummarizeResults {
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly apiKey: string;

  constructor(params?: { baseUrl?: string; model?: string; apiKey?: string }) {
    this.apiKey = params?.apiKey || process.env.GEMINI_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is not set.');
    }

    this.baseUrl =
      params?.baseUrl ||
      process.env.GEMINI_BASE_URL ||
      'https://generativelanguage.googleapis.com';
    this.model =
      params?.model || process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
  }

  async execute(input: {
    question: string;
    rows: SqlRow[];
  }): Promise<{ answer: string }> {
    const preview = JSON.stringify(input.rows.slice(0, 50));
    const system =
      'Resuma os resultados da consulta de forma concisa, factual e contextual ao usuário. Responda em português brasileiro.';

    const prompt = `${system}\n\nPergunta do usuário: ${input.question}\n\nDados retornados (amostra): ${preview}`;

    const res = await fetch(
      `${this.baseUrl}/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      },
    );

    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(
        `Gemini error: ${res.status} ${res.statusText} - ${errorBody}`,
      );
    }

    const json: any = await res.json();
    const answer: string =
      json?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return { answer };
  }
}
