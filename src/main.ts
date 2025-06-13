import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import helmet from "helmet";
import { AppModule } from "./main/modules/app.module";
import { GlobalExceptionFilter } from "./presentation/filters/global-exception.filter";
import { ContextAwareLoggerService } from "./infra/logging/context-aware-logger.service";
import { FinancialMetricsService } from "./infra/metrics/financial-metrics.service";
import * as fs from "fs";
import * as path from "path";

async function bootstrap() {
  // Create logs directory if it doesn't exist
  const logsDir = path.join(process.cwd(), "logs");
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  // Create app with custom logger
  const app = await NestFactory.create(AppModule, {
    logger: new ContextAwareLoggerService(),
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const logger = app.get(ContextAwareLoggerService);
  const metricsService = app.get(FinancialMetricsService);

  // Application startup logging
  logger.logBusinessEvent({
    event: "application_startup",
    version: process.env.APP_VERSION || "1.0.0",
    environment: process.env.NODE_ENV || "development",
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
  });

  // Global exception filter with logger
  app.useGlobalFilters(new GlobalExceptionFilter(logger));

  // Security middleware
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    })
  );

  // CORS configuration
  const frontendUrl =
    configService.get("FRONTEND_URL") || "http://localhost:3001";
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "x-trace-id"],
  });

  // Global validation with custom error messages
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        logger.logSecurityEvent({
          event: "validation_error",
          severity: "medium",
          details: errors.map((err) => ({
            property: err.property,
            constraints: err.constraints,
          })),
        });
        return new ValidationPipe().createExceptionFactory()(errors);
      },
    })
  );

  // API prefix
  const apiPrefix = configService.get("API_PREFIX") || "api/v1";
  app.setGlobalPrefix(apiPrefix);

  // Enhanced Swagger documentation
  const config = new DocumentBuilder()
    .setTitle("Personal Financial Management API")
    .setDescription(
      `API for managing personal finances with Clean Architecture and comprehensive observability.
      
      **Features:**
      - User authentication with JWT
      - Financial entries management (Income/Expense)
      - Monthly summaries and analytics
      - Cash flow forecasting
      - Comprehensive monitoring and logging
      
      **Observability:**
      - Prometheus metrics at \`/api/v1/metrics\`
      - Health check at \`/api/v1/health\`
      - Structured logging with trace correlation
      - Request/response tracking
      
      **Security:**
      - JWT-based authentication
      - Rate limiting
      - Input validation
      - CORS protection
      - Security headers`
    )
    .setVersion(process.env.APP_VERSION || "1.0.0")
    .addBearerAuth()
    .addTag("auth", "Authentication and authorization")
    .addTag("entries", "Financial entries management (UC-01 to UC-07)")
    .addTag("summary", "Monthly financial summaries (UC-08)")
    .addTag("forecast", "Cash flow forecasting (UC-09)")
    .addTag("monitoring", "Health checks and metrics")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      tryItOutEnabled: true,
      filter: true,
      syntaxHighlight: {
        theme: "agate",
      },
    },
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 50px 0 }
      .swagger-ui .scheme-container { background: #fafafa; padding: 30px 0 }
    `,
    customSiteTitle: "Financial API Documentation",
  });

  // Graceful shutdown handling
  process.on("SIGTERM", async () => {
    logger.logBusinessEvent({
      event: "application_shutdown",
      reason: "SIGTERM",
      uptime: process.uptime(),
    });
    await app.close();
  });

  process.on("SIGINT", async () => {
    logger.logBusinessEvent({
      event: "application_shutdown",
      reason: "SIGINT",
      uptime: process.uptime(),
    });
    await app.close();
  });

  // Start server
  const port = configService.get("PORT") || 3000;
  const host = configService.get("HOST") || "0.0.0.0";

  await app.listen(port, host);

  // Application ready logging
  logger.logBusinessEvent({
    event: "application_ready",
    port,
    host,
    apiPrefix,
    environment: process.env.NODE_ENV || "development",
    uptime: process.uptime(),
  });

  // Console output for development
  console.log(`\n🚀 Financial Management API`);
  console.log(`📍 Server: http://localhost:${port}/${apiPrefix}`);
  console.log(`📚 Documentation: http://localhost:${port}/${apiPrefix}/docs`);
  console.log(`📊 Metrics: http://localhost:${port}/${apiPrefix}/metrics`);
  console.log(`❤️  Health: http://localhost:${port}/${apiPrefix}/health`);
  console.log(`🔍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`📝 Logs: ${logsDir}`);

  // Initialize metrics
  metricsService.updateActiveUsers("startup", 1);
}

bootstrap().catch((error) => {
  console.error("💥 Application failed to start:", error);
  process.exit(1);
});
