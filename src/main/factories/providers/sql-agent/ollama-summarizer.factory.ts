import { OllamaSummarizerProvider } from '@infra/ai/ollama/ollama-summarizer.provider';

export function makeOllamaSummarizer() {
  return new OllamaSummarizerProvider({});
}
