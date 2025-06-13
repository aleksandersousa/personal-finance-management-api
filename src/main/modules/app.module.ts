import { Module, MiddlewareConsumer, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ThrottlerModule } from "@nestjs/throttler";
import { EntryModule } from "./entry.module";
import { AuthModule } from "./auth.module";
import { ObservabilityModule } from "./observability.module";
import { HealthController } from "@presentation/controllers/health.controller";
import { MetricsController } from "@presentation/controllers/metrics.controller";
import { TraceContextMiddleware } from "../../infra/middleware/trace-context.middleware";
import { typeOrmConfig } from "@infra/db/typeorm/config/data-source";

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", ".env.dev", ".env.prod"],
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

    // Observability (Global)
    ObservabilityModule,

    // Feature Modules
    EntryModule,
    AuthModule,
  ],
  controllers: [HealthController, MetricsController],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply trace context middleware to all routes
    consumer.apply(TraceContextMiddleware).forRoutes("*");
  }
}
