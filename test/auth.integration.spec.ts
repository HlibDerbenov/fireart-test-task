import request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';
dotenv.config();

import { AppModule } from '../src/app.module';
import { EmailService } from '../src/email/email.service';
import { runMigrations } from '../src/scripts/migrate';
import { closeDb } from '../src/db';

// Ensure migrations are run before tests (migrate script executes migrations)
jest.setTimeout(30000);

describe('Auth integration (e2e)', () => {
  let app: INestApplication;
  let emailService: EmailService;

  beforeAll(async () => {
    // Run migrations via exported function (includes DB wait/retry)
    await runMigrations();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    emailService = moduleRef.get<EmailService>(EmailService);
    emailService.clear();

    app = moduleRef.createNestApplication();

    // Match main.ts runtime configuration used by the app:
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
    // close pool to avoid open handles in Jest
    await closeDb();
  });

  const user = { email: 'itest@example.com', password: 'Password123' };

  it('signup -> login -> request-reset -> reset -> login with new password', async () => {
    // Signup
    await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send(user)
      .expect(201);

    // Duplicate signup -> 400
    await request(app.getHttpServer()).post('/api/auth/signup').send(user).expect(400);

    // Login good
    const loginRes = await request(app.getHttpServer()).post('/api/auth/login').send(user).expect(201);
    expect(loginRes.body.token).toBeDefined();

    // Login bad password
    await request(app.getHttpServer()).post('/api/auth/login').send({ email: user.email, password: 'wrongpass' }).expect(401);

    // Request reset
    await request(app.getHttpServer()).post('/api/auth/request-reset').send({ email: user.email }).expect(201);

    // Retrieve token from email service stub
    const sent = emailService.getLastToken(user.email);
    expect(sent).toBeDefined();
    const token = sent.token;
    expect(token).toHaveLength(64); // 32 bytes hex => 64 chars

    // Reset password
    await request(app.getHttpServer()).post('/api/auth/reset').send({ token, newPassword: 'NewPass123' }).expect(201);

    // Login with new password
    const loginRes2 = await request(app.getHttpServer()).post('/api/auth/login').send({ email: user.email, password: 'NewPass123' }).expect(201);
    expect(loginRes2.body.token).toBeDefined();
  });
});
