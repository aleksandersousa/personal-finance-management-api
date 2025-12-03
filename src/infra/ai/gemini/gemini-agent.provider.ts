import type { FetchDataForQuestion } from '@/data/protocols';
import { SqlRow } from '@domain/models';
import * as fs from 'fs';
import * as defaultApiSpec from '../centralmind/gateway-spec.json';

type ApiPaths = {
  [path: string]: {
    [method: string]: {
      summary?: string;
      description?: string;
      parameters?: any[];
    };
  };
};

export class GeminiAgentProvider implements FetchDataForQuestion {
  private readonly geminiBaseUrl: string;
  private readonly geminiModel: string;
  private readonly geminiApiKey: string;
  private readonly gatewayBaseUrl: string;
  private readonly apiSpecPaths: ApiPaths;

  constructor(params?: {
    geminiBaseUrl?: string;
    geminiModel?: string;
    geminiApiKey?: string;
    gatewayBaseUrl?: string;
    apiSpecPath?: string;
  }) {
    this.geminiApiKey =
      params?.geminiApiKey || process.env.GEMINI_API_KEY || '';

    if (!this.geminiApiKey) {
      throw new Error('GEMINI_API_KEY is not set.');
    }

    this.geminiBaseUrl =
      params?.geminiBaseUrl ||
      process.env.GEMINI_BASE_URL ||
      'https://generativelanguage.googleapis.com';
    this.geminiModel =
      params?.geminiModel ||
      process.env.GEMINI_MODEL ||
      'gemini-2.5-flash-lite';
    this.gatewayBaseUrl =
      params?.gatewayBaseUrl || process.env.GATEWAY_BASE_URL || '';

    let apiSpec: any;

    if (params?.apiSpecPath) {
      // If a custom path is provided, read from file system
      if (!fs.existsSync(params.apiSpecPath)) {
        throw new Error(
          `API Spec not found at ${params.apiSpecPath}. Please fetch it from your running CentralMind Gateway by running: curl http://localhost:9090/openapi.json > api/src/infra/ai/centralmind/gateway-spec.json`,
        );
      }
      apiSpec = JSON.parse(fs.readFileSync(params.apiSpecPath, 'utf-8'));
    } else {
      // Use the imported default spec
      apiSpec = defaultApiSpec;
    }

    this.apiSpecPaths = apiSpec.paths || {};
  }

  async execute(input: {
    question: string;
    userId: string;
  }): Promise<{ result: SqlRow[] }> {
    const endpoint = await this.findBestEndpoint(input.question, input.userId);
    if (!endpoint) {
      throw new Error(
        'Could not determine an appropriate API endpoint to answer the question.',
      );
    }

    const { httpMethod, path: apiPath, queryParams } = endpoint;
    const url = new URL(`${this.gatewayBaseUrl}${apiPath}`);

    // Add query parameters if they exist
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    const res = await fetch(url.toString(), {
      method: httpMethod.toUpperCase(),
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(
        `CentralMind Gateway error: ${res.status} ${res.statusText} - ${errorBody}`,
      );
    }

    const result = await res.json();

    return { result: Array.isArray(result) ? result : [result] };
  }

  private async findBestEndpoint(
    question: string,
    userId: string,
  ): Promise<{
    httpMethod: string;
    path: string;
    queryParams?: Record<string, any>;
  } | null> {
    const system = [
      'You are an AI agent that selects the best API endpoint to answer a user question.',
      'Based on the user question and the provided API specification, choose the most suitable HTTP endpoint.',
      'The user_id is: ' + userId,
      'If the endpoint requires parameters (like user_id, limit, etc.), include them in the "queryParams" object.',
      'Respond ONLY with a valid JSON object containing "httpMethod", "path", and optionally "queryParams".',
      'Example Response: {"httpMethod": "GET", "path": "/expenses", "queryParams": {"user_id": "123", "limit": 10}}',
      'API Specification (Available Endpoints):',
      JSON.stringify(this.apiSpecPaths, null, 2),
    ].join('\n');

    const prompt = `${system}\n\n---\n\nUser Question: ${question}`;

    const res = await fetch(
      `${this.geminiBaseUrl}/v1beta/models/${this.geminiModel}:generateContent?key=${this.geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
          },
        }),
      },
    );

    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(
        `Gemini Agent Error: ${res.status} ${res.statusText} - ${errorBody}`,
      );
    }

    const json = await res.json();
    const content = json?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    try {
      const parsed = JSON.parse(content);
      return parsed.httpMethod && parsed.path ? parsed : null;
    } catch (error) {
      console.error('Failed to parse Gemini agent response:', content);
      return null;
    }
  }
}
