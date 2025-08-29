import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { json } from 'express';
import * as dotenv from 'dotenv';
import { AppModule } from './app.module';
import { initDb } from './db';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

dotenv.config();

// Ensure config is validated before application starts
import { config } from './config';

// Add JWT guard (protect routes by default)
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './auth/jwt.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.use(json());

  // Validate & transform incoming requests using DTOs and class-validator
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Fail-closed auth: protect all routes by default.
  // Use @Public() decorator to allow anonymous access to specific endpoints (signup/login/reset).
  app.useGlobalGuards(new JwtAuthGuard(new Reflector()));

  // Swagger / OpenAPI
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Skeleton Challenge API')
    .setDescription('API documentation (generated). Use the Postman collection in docs/ to run tests.')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'bearerAuth',
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(config.PORT);

  // Initialize DB (creates tables/indexes if missing)
  await initDb();

  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://localhost:${port}/api`);
}
bootstrap();
