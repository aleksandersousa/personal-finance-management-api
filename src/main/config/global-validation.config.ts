import type { ContextAwareLoggerService } from '@/infra/logging/context-aware-logger.service';
import { ValidationPipe, type INestApplication } from '@nestjs/common';

export const globalValidation = (
  app: INestApplication<any>,
  logger: ContextAwareLoggerService,
) => {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: errors => {
        logger.logSecurityEvent({
          event: 'validation_error',
          severity: 'medium',
          details: errors.map(err => ({
            property: err.property,
            constraints: err.constraints,
          })),
        });
        return new ValidationPipe().createExceptionFactory()(errors);
      },
    }),
  );
};
