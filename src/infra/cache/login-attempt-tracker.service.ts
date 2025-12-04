import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisKeyPrefixService } from './redis-key-prefix.service';

export interface AttemptData {
  count: number;
  lastAttemptAt: number;
}

@Injectable()
export class LoginAttemptTracker {
  private readonly windowTtl: number;
  private readonly redis: Redis;

  constructor(
    @Inject('RedisClient') redis: Redis,
    private readonly configService: ConfigService,
    private readonly keyPrefixService: RedisKeyPrefixService,
  ) {
    this.redis = redis;
    this.windowTtl = parseInt(
      this.configService.get<string>('LOGIN_ATTEMPT_WINDOW_TTL'),
    );
  }

  private calculateDelay(attemptCount: number): number {
    if (attemptCount >= 10) {
      return 15 * 60 * 1000; // 15 minutes
    }
    if (attemptCount >= 7) {
      return 2 * 60 * 1000; // 2 minutes
    }
    if (attemptCount === 6) {
      return 30 * 1000; // 30 seconds
    }
    if (attemptCount === 5) {
      return 10 * 1000; // 10 seconds
    }
    return 0; // No delay
  }

  async getAttemptCount(key: string): Promise<number> {
    const prefixedKey = this.keyPrefixService.prefixKey(
      `login:attempts:${key}`,
    );
    const data = await this.redis.get(prefixedKey);
    if (!data) {
      return 0;
    }
    const parsed: AttemptData = JSON.parse(data);
    return parsed.count;
  }

  async isDelayed(key: string): Promise<boolean> {
    const prefixedKey = this.keyPrefixService.prefixKey(`login:delay:${key}`);
    const delayExpiry = await this.redis.get(prefixedKey);
    if (!delayExpiry) {
      return false;
    }
    const expiryTime = parseInt(delayExpiry);
    return Date.now() < expiryTime;
  }

  async getRemainingDelay(key: string): Promise<number> {
    const prefixedKey = this.keyPrefixService.prefixKey(`login:delay:${key}`);
    const delayExpiry = await this.redis.get(prefixedKey);
    if (!delayExpiry) {
      return 0;
    }
    const expiryTime = parseInt(delayExpiry);
    const remaining = expiryTime - Date.now();
    return remaining > 0 ? remaining : 0;
  }

  async incrementAttempt(key: string): Promise<void> {
    const attemptKey = this.keyPrefixService.prefixKey(`login:attempts:${key}`);
    const delayKey = this.keyPrefixService.prefixKey(`login:delay:${key}`);

    // Get current attempt data
    const currentData = await this.redis.get(attemptKey);
    let attemptData: AttemptData;

    if (currentData) {
      attemptData = JSON.parse(currentData);
      attemptData.count += 1;
      attemptData.lastAttemptAt = Date.now();
    } else {
      attemptData = {
        count: 1,
        lastAttemptAt: Date.now(),
      };
    }

    // Save updated attempt data with TTL
    await this.redis.setex(
      attemptKey,
      this.windowTtl,
      JSON.stringify(attemptData),
    );

    // Calculate and set delay if threshold reached
    const delay = this.calculateDelay(attemptData.count);
    if (delay > 0) {
      const delayExpiry = Date.now() + delay;
      await this.redis.setex(
        delayKey,
        Math.ceil(delay / 1000),
        delayExpiry.toString(),
      );
    }
  }

  async resetAttempts(key: string): Promise<void> {
    await this.redis.del(
      this.keyPrefixService.prefixKey(`login:attempts:${key}`),
    );
    await this.redis.del(this.keyPrefixService.prefixKey(`login:delay:${key}`));
  }

  async checkDelay(
    email: string,
    ipAddress: string,
  ): Promise<{
    isDelayed: boolean;
    key: string;
    remainingDelayMs?: number;
  }> {
    const emailKey = `email:${email.toLowerCase()}`;
    const ipKey = `ip:${ipAddress}`;

    const emailDelayed = await this.isDelayed(emailKey);
    if (emailDelayed) {
      const remainingDelay = await this.getRemainingDelay(emailKey);
      return {
        isDelayed: true,
        key: emailKey,
        remainingDelayMs: remainingDelay,
      };
    }

    const ipDelayed = await this.isDelayed(ipKey);
    if (ipDelayed) {
      const remainingDelay = await this.getRemainingDelay(ipKey);
      return { isDelayed: true, key: ipKey, remainingDelayMs: remainingDelay };
    }

    return { isDelayed: false, key: '' };
  }

  async incrementAttempts(email: string, ipAddress: string): Promise<void> {
    const emailKey = `email:${email.toLowerCase()}`;
    const ipKey = `ip:${ipAddress}`;

    await Promise.all([
      this.incrementAttempt(emailKey),
      this.incrementAttempt(ipKey),
    ]);
  }

  async resetAllAttempts(email: string, ipAddress: string): Promise<void> {
    const emailKey = `email:${email.toLowerCase()}`;
    const ipKey = `ip:${ipAddress}`;

    await Promise.all([
      this.resetAttempts(emailKey),
      this.resetAttempts(ipKey),
    ]);
  }
}
