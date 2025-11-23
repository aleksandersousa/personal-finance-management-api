import { OllamaSqlGeneratorProvider } from '@infra/ai/ollama/ollama-sql-generator.provider';

export function makeOllamaSqlGenerator() {
  return new OllamaSqlGeneratorProvider({});
}
