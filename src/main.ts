import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import helmet from "helmet";
import { AppModule } from "./main/modules/app.module";
import { GlobalExceptionFilter } from "./presentation/filters/global-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Security
  app.use(helmet());

  // CORS
  app.enableCors({
    origin: configService.get("FRONTEND_URL") || "http://localhost:3001",
    credentials: true,
  });

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // API prefix
  const apiPrefix = configService.get("API_PREFIX") || "api/v1";
  app.setGlobalPrefix(apiPrefix);

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle("Personal Financial Management API")
    .setDescription(
      "API for managing personal finances with Clean Architecture"
    )
    .setVersion("1.0")
    .addBearerAuth()
    .addTag("entries", "Financial entries management")
    .addTag("auth", "Authentication and authorization")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Start server
  const port = configService.get("PORT") || 3000;
  await app.listen(port);

  console.log(
    `🚀 Application is running on: http://localhost:${port}/${apiPrefix}`
  );
  console.log(
    `📚 Swagger docs available at: http://localhost:${port}/${apiPrefix}/docs`
  );
}

bootstrap();
