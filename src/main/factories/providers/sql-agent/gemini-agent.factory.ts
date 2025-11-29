import { GeminiAgentProvider } from '@infra/ai/gemini';
import * as path from 'path';

// Factory function to create Gemini Agent instance
export function makeGeminiAgent() {
  return new GeminiAgentProvider({
    geminiApiKey: process.env.GEMINI_API_KEY,
    geminiBaseUrl: process.env.GEMINI_BASE_URL,
    geminiModel: process.env.GEMINI_MODEL,
    gatewayBaseUrl: process.env.GATEWAY_BASE_URL,
    apiSpecPath: path.resolve(
      __dirname,
      '../../../../infra/ai/centralmind/gateway-spec.json',
    ),
  });
}
