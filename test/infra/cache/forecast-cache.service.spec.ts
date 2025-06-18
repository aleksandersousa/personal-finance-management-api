import { ForecastCacheService } from '../../../src/infra/cache/forecast-cache.service';
import { MockCashFlowForecastFactory } from '../../domain/mocks/usecases/predict-cash-flow.mock';

describe('ForecastCacheService', () => {
  let cacheService: ForecastCacheService;

  beforeEach(() => {
    cacheService = new ForecastCacheService();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    cacheService.clear();
  });

  describe('generateCacheKey', () => {
    it('should generate a unique key based on the input data', () => {
      // Arrange
      const data1 = {
        userId: 'user1',
        months: 3,
        includeFixed: true,
        includeRecurring: false,
      };
      const data2 = {
        userId: 'user1',
        months: 6,
        includeFixed: true,
        includeRecurring: false,
      };
      const data3 = {
        userId: 'user2',
        months: 3,
        includeFixed: true,
        includeRecurring: false,
      };

      // Act
      const key1 = cacheService.generateCacheKey(data1);
      const key2 = cacheService.generateCacheKey(data2);
      const key3 = cacheService.generateCacheKey(data3);

      // Assert
      expect(key1).toBe('forecast:user1:3:true:false');
      expect(key2).toBe('forecast:user1:6:true:false');
      expect(key3).toBe('forecast:user2:3:true:false');
      expect(key1).not.toBe(key2);
      expect(key1).not.toBe(key3);
    });
  });

  describe('set and get', () => {
    it('should store and retrieve a forecast', () => {
      // Arrange
      const key = 'forecast:user1:3:true:false';
      const forecast = MockCashFlowForecastFactory.create();

      // Act
      cacheService.set(key, forecast);
      const cachedForecast = cacheService.get(key);

      // Assert
      expect(cachedForecast).toEqual(forecast);
    });

    it('should return null for non-existent keys', () => {
      // Act
      const cachedForecast = cacheService.get('non-existent-key');

      // Assert
      expect(cachedForecast).toBeNull();
    });

    it('should return null for expired cache entries', () => {
      // Arrange
      const key = 'forecast:user1:3:true:false';
      const forecast = MockCashFlowForecastFactory.create();

      // Act - Set cache
      cacheService.set(key, forecast);

      // Advance time beyond TTL (5 minutes)
      jest.advanceTimersByTime(6 * 60 * 1000);

      // Try to get expired cache
      const cachedForecast = cacheService.get(key);

      // Assert
      expect(cachedForecast).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete a specific cache entry', () => {
      // Arrange
      const key = 'forecast:user1:3:true:false';
      const forecast = MockCashFlowForecastFactory.create();
      cacheService.set(key, forecast);

      // Act
      const result = cacheService.delete(key);
      const cachedForecast = cacheService.get(key);

      // Assert
      expect(result).toBe(true);
      expect(cachedForecast).toBeNull();
    });

    it('should return false when trying to delete non-existent key', () => {
      // Act
      const result = cacheService.delete('non-existent-key');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('clear', () => {
    it('should remove all cache entries', () => {
      // Arrange
      const key1 = 'forecast:user1:3:true:false';
      const key2 = 'forecast:user2:6:false:true';

      cacheService.set(key1, MockCashFlowForecastFactory.create());
      cacheService.set(key2, MockCashFlowForecastFactory.create());

      expect(cacheService.get(key1)).not.toBeNull();
      expect(cacheService.get(key2)).not.toBeNull();

      // Act
      cacheService.clear();

      // Assert
      expect(cacheService.get(key1)).toBeNull();
      expect(cacheService.get(key2)).toBeNull();
    });
  });

  describe('clearExpired', () => {
    it('should remove only expired entries', () => {
      // Arrange
      const key1 = 'forecast:user1:3:true:false';
      const key2 = 'forecast:user2:6:false:true';

      cacheService.set(key1, MockCashFlowForecastFactory.create());
      cacheService.set(key2, MockCashFlowForecastFactory.create());

      // Advance time beyond TTL for first entry
      jest.advanceTimersByTime(6 * 60 * 1000);

      // Add another entry that should not expire
      const key3 = 'forecast:user3:12:true:true';
      cacheService.set(key3, MockCashFlowForecastFactory.create());

      // Act
      const deletedCount = cacheService.clearExpired();

      // Assert
      expect(deletedCount).toBe(2); // key1 and key2 should be expired
      expect(cacheService.get(key1)).toBeNull();
      expect(cacheService.get(key2)).toBeNull();
      expect(cacheService.get(key3)).not.toBeNull();
    });
  });

  describe('getStats', () => {
    it('should return correct cache statistics', () => {
      // Arrange
      const key1 = 'forecast:user1:3:true:false';
      const key2 = 'forecast:user2:6:false:true';

      cacheService.set(key1, MockCashFlowForecastFactory.create());
      cacheService.set(key2, MockCashFlowForecastFactory.create());

      // Advance time beyond TTL for first entry
      jest.advanceTimersByTime(6 * 60 * 1000);

      // Add another entry that should not expire
      const key3 = 'forecast:user3:12:true:true';
      cacheService.set(key3, MockCashFlowForecastFactory.create());

      // Act
      const stats = cacheService.getStats();

      // Assert
      expect(stats.size).toBe(3);
      expect(stats.expired).toBe(2);
      expect(stats.valid).toBe(1);
    });
  });

  describe('invalidateUserCache', () => {
    it('should remove all cache entries for a specific user', () => {
      // Arrange
      const user1Key1 = 'forecast:user1:3:true:false';
      const user1Key2 = 'forecast:user1:6:false:true';
      const user2Key = 'forecast:user2:3:true:false';

      cacheService.set(user1Key1, MockCashFlowForecastFactory.create());
      cacheService.set(user1Key2, MockCashFlowForecastFactory.create());
      cacheService.set(user2Key, MockCashFlowForecastFactory.create());

      // Act
      const deletedCount = cacheService.invalidateUserCache('user1');

      // Assert
      expect(deletedCount).toBe(2);
      expect(cacheService.get(user1Key1)).toBeNull();
      expect(cacheService.get(user1Key2)).toBeNull();
      expect(cacheService.get(user2Key)).not.toBeNull();
    });

    it('should return 0 when no entries exist for the user', () => {
      // Act
      const deletedCount =
        cacheService.invalidateUserCache('non-existent-user');

      // Assert
      expect(deletedCount).toBe(0);
    });
  });
});
