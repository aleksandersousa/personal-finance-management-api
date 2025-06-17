import { ForecastCache } from '@data/protocols/cache';
import { CashFlowForecast } from '@domain/usecases/predict-cash-flow.usecase';

export class ForecastCacheStub implements ForecastCache {
  private cache = new Map<string, any>();
  private shouldReturnCachedValue = false;
  private mockCachedValue: any = null;

  generateCacheKey(data: any): string {
    return `forecast:${data.userId}:${data.months}:${data.includeFixed}:${data.includeRecurring}`;
  }

  get(key: string): any | null {
    if (this.shouldReturnCachedValue) {
      return this.mockCachedValue;
    }
    return this.cache.get(key) || null;
  }

  set(key: string, value: any): void {
    this.cache.set(key, value);
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  invalidateUserCache(userId: string): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.includes(`forecast:${userId}:`)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  getStats(): { size: number; expired: number; valid: number } {
    return {
      size: this.cache.size,
      expired: 0,
      valid: this.cache.size,
    };
  }

  // Test helpers
  mockCacheHit(value: CashFlowForecast): void {
    this.shouldReturnCachedValue = true;
    this.mockCachedValue = value;
  }

  mockCacheMiss(): void {
    this.shouldReturnCachedValue = false;
    this.mockCachedValue = null;
  }
}
