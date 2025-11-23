import { Injectable } from '@nestjs/common';
import {
  CashFlowForecast,
  PredictCashFlowData,
} from '@domain/usecases/predict-cash-flow.usecase';
import { ForecastCache } from '@data/protocols/cache';

@Injectable()
export class ForecastCacheService implements ForecastCache {
  private cache = new Map<
    string,
    { data: CashFlowForecast; timestamp: number }
  >();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

  generateCacheKey(data: PredictCashFlowData): string {
    return `forecast:${data.userId}:${data.months}:${data.includeFixed}:${data.includeRecurring}`;
  }

  set(key: string, value: CashFlowForecast): void {
    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
    });
  }

  get(key: string): CashFlowForecast | null {
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    // Check if cache has expired
    if (Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clear expired entries periodically
  clearExpired(): number {
    const now = Date.now();
    let deletedCount = 0;

    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.TTL) {
        this.cache.delete(key);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  // Get cache statistics
  getStats(): {
    size: number;
    expired: number;
    valid: number;
  } {
    const now = Date.now();
    let expired = 0;
    let valid = 0;

    for (const [, value] of this.cache.entries()) {
      if (now - value.timestamp > this.TTL) {
        expired++;
      } else {
        valid++;
      }
    }

    return {
      size: this.cache.size,
      expired,
      valid,
    };
  }

  // Invalidate cache for a specific user (when they create/update/delete entries)
  invalidateUserCache(userId: string): number {
    let deletedCount = 0;

    for (const key of this.cache.keys()) {
      if (key.includes(`forecast:${userId}:`)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }

    return deletedCount;
  }
}
