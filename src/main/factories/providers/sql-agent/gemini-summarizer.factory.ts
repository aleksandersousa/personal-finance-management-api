import { GeminiSummarizerProvider } from '@infra/ai/gemini';

export function makeGeminiSummarizer() {
  return new GeminiSummarizerProvider({
    apiKey: process.env.GEMINI_API_KEY,
    baseUrl: process.env.GEMINI_BASE_URL,
    model: process.env.GEMINI_MODEL,
  });
}
