import type { ContextAwareLoggerService } from '@/infra/logging/context-aware-logger.service';
import type { INestApplication } from '@nestjs/common';

export const gracefulShutdown = (
  app: INestApplication<any>,
  logger: ContextAwareLoggerService,
) => {
  process.on('SIGTERM', async () => {
    logger.logBusinessEvent({
      event: 'application_shutdown',
      reason: 'SIGTERM',
      uptime: process.uptime(),
    });
    await app.close();
  });

  process.on('SIGINT', async () => {
    logger.logBusinessEvent({
      event: 'application_shutdown',
      reason: 'SIGINT',
      uptime: process.uptime(),
    });
    await app.close();
  });
};
