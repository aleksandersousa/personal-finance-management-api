import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ThrottlerModule } from "@nestjs/throttler";
import { EntryModule } from "./entry.module";
import { AuthModule } from "./auth.module";
import { HealthController } from "@presentation/controllers/health.controller";
import { typeOrmConfig } from "@infra/db/typeorm/config/data-source";

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),

    // Database
    TypeOrmModule.forRootAsync({
      useFactory: () => typeOrmConfig,
    }),

    // Throttling (Rate Limiting)
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL || "60"),
        limit: parseInt(process.env.THROTTLE_LIMIT || "10"),
      },
    ]),

    // Feature Modules
    EntryModule,
    AuthModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
