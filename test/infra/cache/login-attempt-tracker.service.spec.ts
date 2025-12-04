import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { LoginAttemptTracker } from '@infra/cache/login-attempt-tracker.service';
import { RedisKeyPrefixService } from '@infra/cache/redis-key-prefix.service';

describe('LoginAttemptTracker', () => {
  let service: LoginAttemptTracker;
  let mockRedis: jest.Mocked<Redis>;
  let mockConfigService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    // Mock Redis client
    mockRedis = {
      get: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
    } as any;

    // Mock ConfigService
    mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'LOGIN_ATTEMPT_WINDOW_TTL') {
          return '3600';
        }
        if (key === 'REDIS_KEY_PREFIX') {
          return undefined; // No prefix for tests
        }
        return undefined;
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginAttemptTracker,
        {
          provide: 'RedisClient',
          useValue: mockRedis,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        RedisKeyPrefixService,
      ],
    }).compile();

    service = module.get<LoginAttemptTracker>(LoginAttemptTracker);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAttemptCount', () => {
    it('should return 0 when no attempts exist', async () => {
      mockRedis.get.mockResolvedValue(null);

      const count = await service.getAttemptCount('email:test@example.com');

      expect(count).toBe(0);
      expect(mockRedis.get).toHaveBeenCalledWith(
        'login:attempts:email:test@example.com',
      );
    });

    it('should return correct attempt count when data exists', async () => {
      const attemptData = {
        count: 5,
        lastAttemptAt: Date.now(),
      };
      mockRedis.get.mockResolvedValue(JSON.stringify(attemptData));

      const count = await service.getAttemptCount('email:test@example.com');

      expect(count).toBe(5);
    });
  });

  describe('isDelayed', () => {
    it('should return false when no delay exists', async () => {
      mockRedis.get.mockResolvedValue(null);

      const isDelayed = await service.isDelayed('email:test@example.com');

      expect(isDelayed).toBe(false);
      expect(mockRedis.get).toHaveBeenCalledWith(
        'login:delay:email:test@example.com',
      );
    });

    it('should return true when delay is active', async () => {
      const futureTime = Date.now() + 60000; // 1 minute in future
      mockRedis.get.mockResolvedValue(futureTime.toString());

      const isDelayed = await service.isDelayed('email:test@example.com');

      expect(isDelayed).toBe(true);
    });

    it('should return false when delay has expired', async () => {
      const pastTime = Date.now() - 60000; // 1 minute in past
      mockRedis.get.mockResolvedValue(pastTime.toString());

      const isDelayed = await service.isDelayed('email:test@example.com');

      expect(isDelayed).toBe(false);
    });
  });

  describe('getRemainingDelay', () => {
    it('should return 0 when no delay exists', async () => {
      mockRedis.get.mockResolvedValue(null);

      const remaining = await service.getRemainingDelay(
        'email:test@example.com',
      );

      expect(remaining).toBe(0);
    });

    it('should return correct remaining time when delay is active', async () => {
      const delayMs = 30000; // 30 seconds
      const futureTime = Date.now() + delayMs;
      mockRedis.get.mockResolvedValue(futureTime.toString());

      const remaining = await service.getRemainingDelay(
        'email:test@example.com',
      );

      expect(remaining).toBeGreaterThan(0);
      expect(remaining).toBeLessThanOrEqual(delayMs);
    });

    it('should return 0 when delay has expired', async () => {
      const pastTime = Date.now() - 60000;
      mockRedis.get.mockResolvedValue(pastTime.toString());

      const remaining = await service.getRemainingDelay(
        'email:test@example.com',
      );

      expect(remaining).toBe(0);
    });
  });

  describe('incrementAttempt', () => {
    it('should create new attempt data when none exists', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockRedis.setex.mockResolvedValue('OK');

      await service.incrementAttempt('email:test@example.com');

      expect(mockRedis.get).toHaveBeenCalledWith(
        'login:attempts:email:test@example.com',
      );
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'login:attempts:email:test@example.com',
        3600,
        expect.stringContaining('"count":1'),
      );
    });

    it('should increment existing attempt count', async () => {
      const existingData = {
        count: 3,
        lastAttemptAt: Date.now() - 1000,
      };
      mockRedis.get.mockResolvedValue(JSON.stringify(existingData));
      mockRedis.setex.mockResolvedValue('OK');

      await service.incrementAttempt('email:test@example.com');

      expect(mockRedis.setex).toHaveBeenCalledWith(
        'login:attempts:email:test@example.com',
        3600,
        expect.stringContaining('"count":4'),
      );
    });
  });

  describe('resetAttempts', () => {
    it('should delete both attempt and delay keys', async () => {
      mockRedis.del.mockResolvedValue(1);

      await service.resetAttempts('email:test@example.com');

      expect(mockRedis.del).toHaveBeenCalledTimes(2);
      expect(mockRedis.del).toHaveBeenCalledWith(
        'login:attempts:email:test@example.com',
      );
      expect(mockRedis.del).toHaveBeenCalledWith(
        'login:delay:email:test@example.com',
      );
    });
  });

  describe('checkDelay', () => {
    it('should return false when neither email nor IP is delayed', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await service.checkDelay(
        'test@example.com',
        '192.168.1.1',
      );

      expect(result.isDelayed).toBe(false);
      expect(result.key).toBe('');
      expect(result.remainingDelayMs).toBeUndefined();
      expect(mockRedis.get).toHaveBeenCalledTimes(2);
    });

    it('should return true with remaining delay when email is delayed', async () => {
      const futureTime = Date.now() + 60000;
      mockRedis.get.mockImplementation((key: string) => {
        if (key.includes('login:delay:email:test@example.com')) {
          return Promise.resolve(futureTime.toString());
        }
        if (key.includes('login:delay:ip:192.168.1.1')) {
          return Promise.resolve(null);
        }
        return Promise.resolve(null);
      });

      const result = await service.checkDelay(
        'test@example.com',
        '192.168.1.1',
      );

      expect(result.isDelayed).toBe(true);
      expect(result.key).toBe('email:test@example.com');
      expect(result.remainingDelayMs).toBeGreaterThan(0);
      expect(result.remainingDelayMs).toBeLessThanOrEqual(60000);
    });

    it('should return true with remaining delay when IP is delayed', async () => {
      const futureTime = Date.now() + 60000;
      mockRedis.get.mockImplementation((key: string) => {
        if (key.includes('login:delay:email:test@example.com')) {
          return Promise.resolve(null);
        }
        if (key.includes('login:delay:ip:192.168.1.1')) {
          return Promise.resolve(futureTime.toString());
        }
        return Promise.resolve(null);
      });

      const result = await service.checkDelay(
        'test@example.com',
        '192.168.1.1',
      );

      expect(result.isDelayed).toBe(true);
      expect(result.key).toBe('ip:192.168.1.1');
      expect(result.remainingDelayMs).toBeGreaterThan(0);
      expect(result.remainingDelayMs).toBeLessThanOrEqual(60000);
    });
  });

  describe('incrementAttempts', () => {
    it('should increment attempts for both email and IP', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockRedis.setex.mockResolvedValue('OK');

      await service.incrementAttempts('test@example.com', '192.168.1.1');

      expect(mockRedis.get).toHaveBeenCalledTimes(2);
      expect(mockRedis.setex).toHaveBeenCalledTimes(2);
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'login:attempts:email:test@example.com',
        3600,
        expect.any(String),
      );
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'login:attempts:ip:192.168.1.1',
        3600,
        expect.any(String),
      );
    });
  });

  describe('resetAllAttempts', () => {
    it('should reset attempts for both email and IP', async () => {
      mockRedis.del.mockResolvedValue(1);

      await service.resetAllAttempts('test@example.com', '192.168.1.1');

      expect(mockRedis.del).toHaveBeenCalledTimes(4); // 2 keys × 2 (attempts + delay)
      expect(mockRedis.del).toHaveBeenCalledWith(
        'login:attempts:email:test@example.com',
      );
      expect(mockRedis.del).toHaveBeenCalledWith(
        'login:delay:email:test@example.com',
      );
      expect(mockRedis.del).toHaveBeenCalledWith(
        'login:attempts:ip:192.168.1.1',
      );
      expect(mockRedis.del).toHaveBeenCalledWith('login:delay:ip:192.168.1.1');
    });
  });

  describe('delay calculation thresholds', () => {
    it('should not set delay for attempts below 5', async () => {
      for (let count = 1; count < 5; count++) {
        const existingData = {
          count: count - 1,
          lastAttemptAt: Date.now() - 1000,
        };
        mockRedis.get.mockResolvedValue(JSON.stringify(existingData));
        mockRedis.setex.mockResolvedValue('OK');

        await service.incrementAttempt('email:test@example.com');

        const delayCalls = mockRedis.setex.mock.calls.filter(call =>
          call[0].includes('delay'),
        );
        expect(delayCalls.length).toBe(0);

        jest.clearAllMocks();
      }
    });

    it('should set correct delays for each threshold', async () => {
      const thresholds = [
        { count: 5, expectedDelaySeconds: 10 },
        { count: 6, expectedDelaySeconds: 30 },
        { count: 7, expectedDelaySeconds: 120 },
        { count: 8, expectedDelaySeconds: 120 },
        { count: 9, expectedDelaySeconds: 120 },
        { count: 10, expectedDelaySeconds: 900 },
        { count: 15, expectedDelaySeconds: 900 },
      ];

      for (const threshold of thresholds) {
        const existingData = {
          count: threshold.count - 1,
          lastAttemptAt: Date.now() - 1000,
        };
        mockRedis.get.mockResolvedValue(JSON.stringify(existingData));
        mockRedis.setex.mockResolvedValue('OK');

        await service.incrementAttempt('email:test@example.com');

        const delayCall = mockRedis.setex.mock.calls.find(call =>
          call[0].includes('delay'),
        );
        expect(delayCall).toBeDefined();
        expect(delayCall[1]).toBe(threshold.expectedDelaySeconds);

        jest.clearAllMocks();
      }
    });
  });
});
