import { OllamaSummarizerProvider } from '@/infra/ai/ollama/ollama-summarizer.provider';

describe('OllamaSummarizerProvider', () => {
  const originalFetch = global.fetch as any;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('should call ollama and return content', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: { content: 'resposta' } }),
    });

    const sut = new OllamaSummarizerProvider({
      baseUrl: 'http://x',
      model: 'm',
    });
    const result = await sut.execute({
      question: 'q',
      rows: [{ a: 1 } as any],
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://x/api/chat',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(result).toEqual({ answer: 'resposta' });
  });

  it('should throw on non-ok response', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: false, status: 500, statusText: 'e' });
    const sut = new OllamaSummarizerProvider({
      baseUrl: 'http://x',
      model: 'm',
    });
    await expect(sut.execute({ question: 'q', rows: [] })).rejects.toThrow(
      'Ollama error: 500 e',
    );
  });

  it('should use json.content when message is absent', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ content: 'fallback' }),
    });
    const sut = new OllamaSummarizerProvider({
      baseUrl: 'http://x',
      model: 'm',
    });
    const result = await sut.execute({ question: 'q', rows: [] });
    expect(result).toEqual({ answer: 'fallback' });
  });

  it('should return empty answer when neither message nor content present', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    const sut = new OllamaSummarizerProvider({
      baseUrl: 'http://x',
      model: 'm',
    });
    const result = await sut.execute({ question: 'q', rows: [] });
    expect(result).toEqual({ answer: '' });
  });
});
