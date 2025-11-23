export interface CacheService<T> {
  generateKey(data: any): string;
  get(key: string): T | null;
  set(key: string, value: T): void;
  delete(key: string): boolean;
  clear(): void;
  invalidateByPattern(pattern: string): number;
}

export interface ForecastCache {
  generateCacheKey(data: any): string;
  get(key: string): any | null;
  set(key: string, value: any): void;
  delete(key: string): boolean;
  clear(): void;
  invalidateUserCache(userId: string): number;
  getStats(): {
    size: number;
    expired: number;
    valid: number;
  };
}
