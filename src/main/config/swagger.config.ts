import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const swaggerConfig = (app: INestApplication<any>, apiPrefix: any) => {
  // API prefix
  app.setGlobalPrefix(apiPrefix);

  // Enhanced Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Personal Financial Management API')
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
       - Security headers`,
    )
    .setVersion(process.env.APP_VERSION || '1.0.0')
    .addBearerAuth()
    .addTag('monitoring', 'Health checks and metrics')
    .addTag('auth', 'Authentication and authorization')
    .addTag('entries', 'Financial entries management')
    .addTag('summary', 'Monthly financial summaries')
    .addTag('forecast', 'Cash flow forecasting')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      tryItOutEnabled: true,
      filter: true,
      syntaxHighlight: {
        theme: 'agate',
      },
    },
    customCss: `
       .swagger-ui .topbar { display: none }
       .swagger-ui .info { margin: 50px 0 }
       .swagger-ui .scheme-container { background: #fafafa; padding: 30px 0 }
     `,
    customSiteTitle: 'Financial API Documentation',
  });
};
