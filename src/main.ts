import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { AppConfigType } from './config/app.config';
import { createValidationPipe } from './common/pipes/validation.pipe';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const appConfig = configService.get<AppConfigType>('app');

  // Security
  app.use(helmet());

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') ?? '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-api-key',
      'x-idempotency-key',
      'x-request-id',
    ],
  });

  // API Prefix
  const apiPrefix = `${appConfig?.apiPrefix ?? 'api'}/${appConfig?.apiVersion ?? 'v1'}`;
  app.setGlobalPrefix(apiPrefix);

  // Validation Pipe
  app.useGlobalPipes(createValidationPipe());

  // Swagger Documentation
  if (appConfig?.nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Inspire Wallet - UnionBank Payment Gateway')
      .setDescription(
        'API documentation for Inspire Wallet UnionBank Payment Gateway (Upay)',
      )
      .setVersion('1.0.0')
      .addBearerAuth()
      .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'api-key')
      .addServer(
        `http://localhost:${appConfig?.port ?? 3000}`,
        'Local Development',
      )
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });

    logger.log(`Swagger documentation available at /docs`);
  }

  // Start Server
  const port = appConfig?.port ?? 3000;
  await app.listen(port);

  logger.log(`Application running on port ${port}`);
  logger.log(`API available at /${apiPrefix}`);
  logger.log(`Environment: ${appConfig?.nodeEnv ?? 'development'}`);
}

void bootstrap();
