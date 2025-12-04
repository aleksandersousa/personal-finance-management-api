import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisKeyPrefixService } from '@/infra/cache/redis-key-prefix.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'RedisClient',
      useFactory: (configService: ConfigService) => {
        const host = configService.get<string>('REDIS_HOST');
        const port = configService.get<number>('REDIS_PORT');
        const password = configService.get<string>('REDIS_PASSWORD');
        const db = configService.get<number>('REDIS_DB');

        const redisConfig: any = {
          host,
          port,
          db,
          retryStrategy: (times: number) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
          maxRetriesPerRequest: null, // Required by BullMQ for blocking commands
        };

        if (password) {
          redisConfig.password = password;
        }

        const redis = new Redis(redisConfig);

        redis.on('error', err => {
          console.error('Redis connection error:', err);
        });

        redis.on('connect', () => {
          console.log('Redis connected successfully');
        });

        return redis;
      },
      inject: [ConfigService],
    },
    RedisKeyPrefixService,
  ],
  exports: ['RedisClient', RedisKeyPrefixService],
})
export class RedisModule {}
