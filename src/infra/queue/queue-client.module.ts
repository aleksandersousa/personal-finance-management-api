import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { RedisModule } from '@main/modules/redis.module';
import { QUEUE_NAMES } from '@domain/constants';
import Redis from 'ioredis';

@Module({
  imports: [
    ConfigModule,
    RedisModule,
    BullModule.forRootAsync({
      imports: [RedisModule],
      useFactory: (_: ConfigService, redisClient: Redis) => {
        return {
          connection: redisClient,
        };
      },
      inject: [ConfigService, 'RedisClient'],
    }),
    BullModule.registerQueue(
      {
        name: QUEUE_NAMES.EMAIL,
        defaultJobOptions: {
          attempts: parseInt(process.env.EMAIL_QUEUE_RETRY_ATTEMPTS || '3', 10),
          backoff: {
            type: 'exponential',
            delay: parseInt(process.env.EMAIL_QUEUE_RETRY_DELAY || '2000', 10),
          },
          removeOnComplete: {
            age: 24 * 3600, // Keep completed jobs for 24 hours
            count: 1000, // Keep last 1000 completed jobs
          },
          removeOnFail: {
            age: 7 * 24 * 3600, // Keep failed jobs for 7 days
          },
        },
      },
      {
        name: QUEUE_NAMES.TOKEN_CLEANUP,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: {
            age: 24 * 3600,
            count: 100,
          },
          removeOnFail: {
            age: 7 * 24 * 3600,
          },
        },
      },
    ),
  ],
  exports: [BullModule],
})
export class QueueClientModule {}
