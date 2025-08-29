import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { json } from 'express';
import * as dotenv from 'dotenv';
import { AppModule } from './app.module';
import { initDb } from './db';
import { ValidationPipe } from '@nestjs/common';

dotenv.config();

import { config } from './config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.use(json());

  // Validate & transform incoming requests using DTOs and class-validator
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const port = Number(config.PORT);

  // Initialize DB (creates tables/indexes if missing)
  await initDb();

  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://localhost:${port}/api`);
}
bootstrap();
