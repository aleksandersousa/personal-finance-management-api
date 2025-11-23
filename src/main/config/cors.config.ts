import type { INestApplication } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';

export const corsConfig = (
  app: INestApplication<any>,
  configService: ConfigService<unknown, boolean>,
) => {
  const frontendUrl =
    configService.get('FRONTEND_URL') || 'http://localhost:3001';
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-trace-id'],
  });
};
