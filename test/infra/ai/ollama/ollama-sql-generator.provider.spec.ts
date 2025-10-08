import { OllamaSqlGeneratorProvider } from '@/infra/ai/ollama/ollama-sql-generator.provider';

describe('OllamaSqlGeneratorProvider', () => {
  const originalFetch = global.fetch as any;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('should call ollama, extract SQL fenced with ```sql and return it', async () => {
    const content = 'x```sql\nSELECT * FROM a;\n```y';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: { content } }),
    });

    const sut = new OllamaSqlGeneratorProvider({
      baseUrl: 'http://x',
      model: 'm',
    });
    const result = await sut.execute({
      schemaSnapshot: 'schema',
      question: { userId: 'u', question: 'q' },
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://x/api/chat',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(result).toEqual({ rawSql: 'SELECT * FROM a' });
  });

  it('should support extracting SQL from generic ``` fences', async () => {
    const content = 'before```\nSELECT 1;\n```after';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: { content } }),
    });

    const sut = new OllamaSqlGeneratorProvider({
      baseUrl: 'http://x',
      model: 'm',
    });
    const result = await sut.execute({
      schemaSnapshot: 'schema',
      question: { userId: 'u', question: 'q' },
    });

    expect(result).toEqual({ rawSql: 'SELECT 1' });
  });

  it('should use json.content when message is absent', async () => {
    const content = '```sql\nSELECT 2;\n```';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ content }),
    });

    const sut = new OllamaSqlGeneratorProvider({
      baseUrl: 'http://x',
      model: 'm',
    });
    const result = await sut.execute({
      schemaSnapshot: 'schema',
      question: { userId: 'u', question: 'q' },
    });

    expect(result).toEqual({ rawSql: 'SELECT 2' });
  });

  it('should throw on non-ok response', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: false, status: 500, statusText: 'e' });

    const sut = new OllamaSqlGeneratorProvider({
      baseUrl: 'http://x',
      model: 'm',
    });

    await expect(
      sut.execute({
        schemaSnapshot: 's',
        question: { userId: 'u', question: 'q' },
      }),
    ).rejects.toThrow('Ollama error: 500 e');
  });

  it('should throw when SQL cannot be extracted from content', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: { content: 'no fences here' } }),
    });

    const sut = new OllamaSqlGeneratorProvider({
      baseUrl: 'http://x',
      model: 'm',
    });

    await expect(
      sut.execute({
        schemaSnapshot: 's',
        question: { userId: 'u', question: 'q' },
      }),
    ).rejects.toThrow('Falha ao extrair SQL do conteúdo do modelo.');
  });

  it('should throw when response has no message or content', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    const sut = new OllamaSqlGeneratorProvider({
      baseUrl: 'http://x',
      model: 'm',
    });

    await expect(
      sut.execute({
        schemaSnapshot: 's',
        question: { userId: 'u', question: 'q' },
      }),
    ).rejects.toThrow('Falha ao extrair SQL do conteúdo do modelo.');
  });
});
