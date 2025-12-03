import { GeminiAgentProvider } from '@infra/ai/gemini';
import * as fs from 'fs';

// Mock fs module
jest.mock('fs');

// Mock fetch globally
global.fetch = jest.fn();

describe('GeminiAgentProvider', () => {
  let sut: GeminiAgentProvider;
  const mockApiKey = 'test-gemini-api-key';
  const mockGatewayUrl = 'http://localhost:9090';

  const mockApiSpec = {
    paths: {
      '/expenses': {
        get: {
          summary: 'Get user expenses',
          description: 'Retrieve expenses filtered by user_id',
        },
      },
      '/income': {
        get: {
          summary: 'Get user income',
          description: 'Retrieve income records',
        },
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GEMINI_API_KEY = mockApiKey;
    process.env.GATEWAY_BASE_URL = mockGatewayUrl;

    // Mock fs.existsSync and fs.readFileSync
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockApiSpec));
  });

  afterEach(() => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GATEWAY_BASE_URL;
  });

  describe('Constructor', () => {
    it('should throw error if GEMINI_API_KEY is not set', () => {
      delete process.env.GEMINI_API_KEY;

      expect(() => {
        new GeminiAgentProvider({});
      }).toThrow('GEMINI_API_KEY is not set.');
    });

    it('should throw error if gateway spec file does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      expect(() => {
        new GeminiAgentProvider({ apiSpecPath: '/custom/path/spec.json' });
      }).toThrow(/API Spec not found/);
    });

    it('should initialize with environment variables', () => {
      expect(() => {
        new GeminiAgentProvider({});
      }).not.toThrow();
    });

    it('should initialize with custom parameters', () => {
      const customParams = {
        geminiApiKey: 'custom-key',
        gatewayBaseUrl: 'http://custom:8080',
        geminiModel: 'gemini-pro',
      };

      expect(() => {
        new GeminiAgentProvider(customParams);
      }).not.toThrow();
    });
  });

  describe('execute', () => {
    beforeEach(() => {
      sut = new GeminiAgentProvider({
        geminiApiKey: mockApiKey,
        gatewayBaseUrl: mockGatewayUrl,
      });
    });

    it('should select correct endpoint and fetch data successfully', async () => {
      // Arrange
      const userId = 'user-123';
      const question = 'Quais são minhas despesas?';

      // Mock Gemini response (endpoint selection)
      const geminiResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    httpMethod: 'GET',
                    path: '/expenses',
                    queryParams: { user_id: userId },
                  }),
                },
              ],
            },
          },
        ],
      };

      // Mock Gateway response (actual data)
      const gatewayResponse = [
        { id: 1, description: 'Food', amount: 100 },
        { id: 2, description: 'Transport', amount: 50 },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => geminiResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => gatewayResponse,
        });

      // Act
      const result = await sut.execute({ question, userId });

      // Assert
      expect(global.fetch).toHaveBeenCalledTimes(2);

      // Check Gemini API call
      expect(global.fetch).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('generativelanguage.googleapis.com'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      // Check Gateway API call
      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('/expenses'),
        expect.objectContaining({
          method: 'GET',
        }),
      );

      expect(result.result).toEqual(gatewayResponse);
    });

    it('should handle non-array response from gateway', async () => {
      // Arrange
      const userId = 'user-456';
      const question = 'Qual meu saldo total?';

      const geminiResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    httpMethod: 'GET',
                    path: '/balance',
                  }),
                },
              ],
            },
          },
        ],
      };

      const gatewayResponse = { total: 1000 };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => geminiResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => gatewayResponse,
        });

      // Act
      const result = await sut.execute({ question, userId });

      // Assert
      expect(result.result).toEqual([gatewayResponse]);
    });

    it('should throw error if Gemini agent fails to select endpoint', async () => {
      // Arrange
      const userId = 'user-789';
      const question = 'Invalid question';

      const geminiResponse = {
        candidates: [
          {
            content: {
              parts: [{ text: '{}' }], // Empty response
            },
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => geminiResponse,
      });

      // Act & Assert
      await expect(sut.execute({ question, userId })).rejects.toThrow(
        'Could not determine an appropriate API endpoint',
      );
    });

    it('should throw error if Gemini API call fails', async () => {
      // Arrange
      const userId = 'user-101';
      const question = 'Test question';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        text: async () => 'Rate limit exceeded',
      });

      // Act & Assert
      await expect(sut.execute({ question, userId })).rejects.toThrow(
        /Gemini Agent Error.*429/,
      );
    });

    it('should throw error if Gateway API call fails', async () => {
      // Arrange
      const userId = 'user-202';
      const question = 'Test question';

      const geminiResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    httpMethod: 'GET',
                    path: '/expenses',
                  }),
                },
              ],
            },
          },
        ],
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => geminiResponse,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          text: async () => 'Gateway error',
        });

      // Act & Assert
      await expect(sut.execute({ question, userId })).rejects.toThrow(
        /CentralMind Gateway error.*500/,
      );
    });

    it('should handle malformed JSON from Gemini', async () => {
      // Arrange
      const userId = 'user-303';
      const question = 'Test question';

      const geminiResponse = {
        candidates: [
          {
            content: {
              parts: [{ text: 'not valid json' }],
            },
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => geminiResponse,
      });

      // Act & Assert
      await expect(sut.execute({ question, userId })).rejects.toThrow(
        'Could not determine an appropriate API endpoint',
      );
    });
  });
});
