import { OllamaSqlGeneratorProvider } from '@/infra/ai/ollama/ollama-sql-generator.provider';

describe('OllamaSqlGeneratorProvider constructor', () => {
  const OLD_ENV = process.env;
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    delete (process.env as any).OLLAMA_BASE_URL;
    delete (process.env as any).OLLAMA_MODEL;
  });
  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('should default to localhost baseUrl and llama3.1 model', () => {
    const sut = new OllamaSqlGeneratorProvider();
    expect((sut as any).baseUrl).toBe('http://localhost:11434');
    expect((sut as any).model).toBe('llama3.1');
  });

  it('should use env vars when provided', () => {
    process.env.OLLAMA_BASE_URL = 'http://env-host';
    process.env.OLLAMA_MODEL = 'env-model';
    const sut = new OllamaSqlGeneratorProvider();
    expect((sut as any).baseUrl).toBe('http://env-host');
    expect((sut as any).model).toBe('env-model');
  });
});
