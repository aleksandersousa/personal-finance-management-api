import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './main/modules/worker.module';
import { ContextAwareLoggerService } from './infra/logging/context-aware-logger.service';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  process.env.IS_WORKER = 'true';

  const logsDir = path.join(process.cwd(), 'logs');
  try {
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  } catch (error) {
    console.warn(
      `Unable to create logs directory: ${error.message}. This is normal when running in a container.`,
    );
  }

  // Create app with custom logger
  const app = await NestFactory.createApplicationContext(WorkerModule, {
    logger: new ContextAwareLoggerService(),
    bufferLogs: true,
  });

  const logger = app.get(ContextAwareLoggerService);

  // Ensure logger is properly connected (flushes buffered logs)
  app.useLogger(logger);

  // Application startup logging
  logger.logBusinessEvent({
    event: 'worker_startup',
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
  });

  // Graceful shutdown handling
  const shutdown = async (signal: string) => {
    logger.log(`Received ${signal}, shutting down gracefully...`);
    try {
      await app.close();
      logger.log('Worker shut down successfully');
      process.exit(0);
    } catch (error) {
      logger.error(`Error during shutdown: ${error.message}`, error.stack);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Application ready logging
  logger.logBusinessEvent({
    event: 'worker_ready',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
  });

  // Console output for development
  console.log(`\n🔧 Queue Worker`);
  console.log(`🔍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📝 Logs: ${logsDir}`);
  console.log(`✅ Worker is ready to process jobs\n`);
}

bootstrap().catch(error => {
  console.error('💥 Worker failed to start:', error);
  process.exit(1);
});
