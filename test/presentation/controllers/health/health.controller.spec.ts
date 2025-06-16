import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from '@presentation/controllers/health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(async () => {
    // Store original environment variables
    originalEnv = { ...process.env };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  afterEach(() => {
    // Restore original environment variables
    process.env = originalEnv;
    // Restore any mocks
    jest.restoreAllMocks();
  });

  describe('health', () => {
    it('should return health status with default version', async () => {
      // Arrange
      delete process.env.APP_VERSION;
      const beforeCall = Date.now();

      // Act
      const result = await controller.health();

      // Assert
      const afterCall = Date.now();
      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('database', 'connected');
      expect(result).toHaveProperty('version', '1.0.0');

      // Verify timestamp is recent
      const resultTime = new Date(result.timestamp).getTime();
      expect(resultTime).toBeGreaterThanOrEqual(beforeCall);
      expect(resultTime).toBeLessThanOrEqual(afterCall);

      // Verify uptime is a number
      expect(typeof result.uptime).toBe('number');
      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should return health status with custom version from environment', async () => {
      // Arrange
      process.env.APP_VERSION = '2.5.0';

      // Act
      const result = await controller.health();

      // Assert
      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('version', '2.5.0');
      expect(result).toHaveProperty('database', 'connected');
    });

    it('should handle errors and return error status', async () => {
      // Arrange - Mock Math.floor to throw an error instead of process.uptime
      const originalMathFloor = Math.floor;
      jest.spyOn(Math, 'floor').mockImplementationOnce(() => {
        throw new Error('Mock error for testing');
      });

      try {
        // Act
        const result = await controller.health();

        // Assert
        expect(result).toHaveProperty('status', 'error');
        expect(result).toHaveProperty('database', 'unknown');
        expect(result).toHaveProperty('uptime');
        expect(result).toHaveProperty('timestamp');
        expect(result).toHaveProperty('version');
      } finally {
        // Restore Math.floor
        Math.floor = originalMathFloor;
      }
    });

    it('should return consistent data structure', async () => {
      // Act
      const result = await controller.health();

      // Assert
      expect(result).toEqual({
        status: expect.any(String),
        uptime: expect.any(Number),
        timestamp: expect.any(String),
        database: expect.any(String),
        version: expect.any(String),
      });
    });

    it('should return ISO timestamp format', async () => {
      // Act
      const result = await controller.health();

      // Assert
      expect(result.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );

      // Verify it's a valid date
      const date = new Date(result.timestamp);
      expect(date.toString()).not.toBe('Invalid Date');
    });

    it('should return reasonable uptime value', async () => {
      // Act
      const result = await controller.health();

      // Assert
      expect(result.uptime).toBeGreaterThanOrEqual(0);
      expect(result.uptime).toBeLessThan(Number.MAX_SAFE_INTEGER);
      expect(Number.isInteger(result.uptime)).toBe(true);
    });
  });
});
