import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ObservabilityModule } from './observability.module';
import { RedisModule } from './redis.module';
import { AppQueueModule } from './queue.module';
import { EmailModule } from './email.module';
import { AuthModule } from './auth.module';
import { NotificationModule } from './notification.module';
import { typeOrmConfig } from '@infra/db/typeorm/config/data-source';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.dev', '.env.prod'],
    }),

    // Database (needed for token cleanup)
    TypeOrmModule.forRootAsync({
      useFactory: () => typeOrmConfig,
    }),

    // Observability (Global)
    ObservabilityModule,

    // Redis Module (Global)
    RedisModule,

    // Queue Module (includes processors)
    AppQueueModule,

    // Email Module (needed for MailgunEmailSender in processor)
    EmailModule,

    // Auth Module (needed for token repositories)
    AuthModule,

    // Notification Module (needed for notification cleanup)
    NotificationModule,
  ],
  providers: [],
})
export class WorkerModule {}
