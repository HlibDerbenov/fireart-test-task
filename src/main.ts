import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { json } from 'express';
import * as dotenv from 'dotenv';
import { AppModule } from './app.module';
import { initDb, closeDb } from './db';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

dotenv.config();

// Ensure config is validated before application starts
import { config } from './config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.use(json());

  app.enableCors({
    origin: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  });

  // Validate & transform incoming requests using DTOs and class-validator
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

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

  // Let Nest react to shutdown signals and run lifecycle hooks
  app.enableShutdownHooks();

  await app.listen(port);
  console.log(`Server listening on http://localhost:${port}/api`);

  // Graceful shutdown helper
  const shutdown = async (signal?: string, err?: unknown) => {
    try {
      console.log(`Shutdown requested${signal ? ` (${signal})` : ''}...`);
      // Allow Nest to run its shutdown hooks
      await app.close();
      // Close DB pool
      await closeDb();
      console.log('Shutdown complete.');
      // exit normally
      process.exit(0);
    } catch (e) {
      console.error('Error during shutdown', e || err);
      process.exit(1);
    }
  };

  // Capture termination signals
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGQUIT', () => shutdown('SIGQUIT'));

  // Attempt graceful shutdown on unexpected failures
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
    shutdown('unhandledRejection', reason);
  });
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    shutdown('uncaughtException', error);
  });
}
bootstrap();
