import { GeminiSummarizerProvider } from '@infra/ai/gemini';
import { SqlRow } from '@domain/models';

// Mock fetch globally
global.fetch = jest.fn();

describe('GeminiSummarizerProvider', () => {
  let sut: GeminiSummarizerProvider;
  const mockApiKey = 'test-gemini-api-key';

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GEMINI_API_KEY = mockApiKey;
  });

  afterEach(() => {
    delete process.env.GEMINI_API_KEY;
  });

  describe('Constructor', () => {
    it('should throw error if GEMINI_API_KEY is not set', () => {
      delete process.env.GEMINI_API_KEY;

      expect(() => {
        new GeminiSummarizerProvider({});
      }).toThrow('GEMINI_API_KEY is not set.');
    });

    it('should initialize with environment variables', () => {
      expect(() => {
        new GeminiSummarizerProvider({});
      }).not.toThrow();
    });

    it('should initialize with custom parameters', () => {
      const customParams = {
        apiKey: 'custom-key',
        model: 'gemini-pro',
        baseUrl: 'https://custom.api.com',
      };

      expect(() => {
        new GeminiSummarizerProvider(customParams);
      }).not.toThrow();
    });
  });

  describe('execute', () => {
    beforeEach(() => {
      sut = new GeminiSummarizerProvider({ apiKey: mockApiKey });
    });

    it('should summarize query results successfully', async () => {
      // Arrange
      const question = 'Quanto gastei este mês?';
      const rows: SqlRow[] = [
        { category: 'Food', amount: 500 },
        { category: 'Transport', amount: 200 },
      ];

      const geminiResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: 'Você gastou R$ 700 este mês, sendo R$ 500 em alimentação e R$ 200 em transporte.',
                },
              ],
            },
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => geminiResponse,
      });

      // Act
      const result = await sut.execute({ question, rows });

      // Assert
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('generativelanguage.googleapis.com'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining(question),
        }),
      );

      expect(result.answer).toBe(
        'Você gastou R$ 700 este mês, sendo R$ 500 em alimentação e R$ 200 em transporte.',
      );
    });

    it('should handle empty results', async () => {
      // Arrange
      const question = 'Tenho despesas?';
      const rows: SqlRow[] = [];

      const geminiResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: 'Você não possui despesas registradas.',
                },
              ],
            },
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => geminiResponse,
      });

      // Act
      const result = await sut.execute({ question, rows });

      // Assert
      expect(result.answer).toBe('Você não possui despesas registradas.');
    });

    it('should limit rows to first 50 when summarizing', async () => {
      // Arrange
      const question = 'Resumo de todas as despesas';
      const rows: SqlRow[] = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        amount: 100,
      }));

      const geminiResponse = {
        candidates: [
          {
            content: {
              parts: [{ text: 'Resumo das primeiras 50 despesas.' }],
            },
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => geminiResponse,
      });

      // Act
      await sut.execute({ question, rows });

      // Assert
      const callBody = JSON.parse(
        (global.fetch as jest.Mock).mock.calls[0][1].body,
      );
      const sentData = callBody.contents[0].parts[0].text;

      // Verify only first 50 rows were sent
      expect(sentData).toContain('"id":50');
      expect(sentData).not.toContain('"id":51');
    });

    it('should throw error if Gemini API call fails', async () => {
      // Arrange
      const question = 'Test question';
      const rows: SqlRow[] = [{ amount: 100 }];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        text: async () => 'Rate limit exceeded',
      });

      // Act & Assert
      await expect(sut.execute({ question, rows })).rejects.toThrow(
        /Gemini error.*429/,
      );
    });

    it('should handle missing candidates in response', async () => {
      // Arrange
      const question = 'Test question';
      const rows: SqlRow[] = [{ amount: 100 }];

      const geminiResponse = {
        candidates: [],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => geminiResponse,
      });

      // Act
      const result = await sut.execute({ question, rows });

      // Assert
      expect(result.answer).toBe('');
    });

    it('should include question and data in the prompt', async () => {
      // Arrange
      const question = 'Qual o total de gastos?';
      const rows: SqlRow[] = [
        { category: 'Food', total: 300 },
        { category: 'Rent', total: 1000 },
      ];

      const geminiResponse = {
        candidates: [
          {
            content: {
              parts: [{ text: 'Total de R$ 1.300' }],
            },
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => geminiResponse,
      });

      // Act
      await sut.execute({ question, rows });

      // Assert
      const callBody = JSON.parse(
        (global.fetch as jest.Mock).mock.calls[0][1].body,
      );
      const prompt = callBody.contents[0].parts[0].text;

      expect(prompt).toContain(question);
      expect(prompt).toContain('Food');
      expect(prompt).toContain('Rent');
      expect(prompt).toContain('português brasileiro');
    });
  });
});
