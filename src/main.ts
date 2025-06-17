import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './main/modules/app.module';
import { GlobalExceptionFilter } from './presentation/filters/global-exception.filter';
import { ContextAwareLoggerService } from './infra/logging/context-aware-logger.service';
import { FinancialMetricsService } from './infra/metrics/financial-metrics.service';
import * as fs from 'fs';
import * as path from 'path';
import {
  swaggerConfig,
  globalValidation,
  corsConfig,
  gracefulShutdown,
} from './main/config';

async function bootstrap() {
  // Create logs directory if it doesn't exist
  const logsDir = path.join(process.cwd(), 'logs');
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
    event: 'application_startup',
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
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
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
    }),
  );

  // CORS configuration
  corsConfig(app, configService);

  // Global validation with custom error messages
  globalValidation(app, logger);

  const apiPrefix = configService.get('API_PREFIX') || 'api/v1';
  swaggerConfig(app, apiPrefix);

  // Graceful shutdown handling
  gracefulShutdown(app, logger);

  // Start server
  const port = configService.get('PORT') || 3000;
  const host = configService.get('HOST') || '0.0.0.0';

  await app.listen(port, host);

  // Application ready logging
  logger.logBusinessEvent({
    event: 'application_ready',
    port,
    host,
    apiPrefix,
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
  });

  // Console output for development
  console.log(`\n🚀 Financial Management API`);
  console.log(`📍 Server: http://localhost:${port}/${apiPrefix}`);
  console.log(`📚 Documentation: http://localhost:${port}/${apiPrefix}/docs`);
  console.log(`📊 Metrics: http://localhost:${port}/${apiPrefix}/metrics`);
  console.log(`❤️  Health: http://localhost:${port}/${apiPrefix}/health`);
  console.log(`🔍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📝 Logs: ${logsDir}`);

  // Initialize metrics
  metricsService.updateActiveUsers('startup', 1);
}

bootstrap().catch(error => {
  console.error('💥 Application failed to start:', error);
  process.exit(1);
});
