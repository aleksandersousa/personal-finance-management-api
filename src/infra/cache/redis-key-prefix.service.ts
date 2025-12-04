import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisKeyPrefixService {
  private readonly prefix: string;

  constructor(private readonly configService: ConfigService) {
    this.prefix = this.configService.get<string>('REDIS_KEY_PREFIX');
  }

  prefixKey(key: string): string {
    return this.prefix ? `${this.prefix}${key}` : key;
  }

  getPrefix(): string {
    return this.prefix;
  }
}
