import request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';
import type { Server } from 'http';

dotenv.config();

import { AppModule } from '../src/app.module';
import { runMigrations } from '../src/scripts/migrate';
import { closeDb } from '../src/db';

jest.setTimeout(30000);

describe('Items + Users "me" integration (e2e)', () => {
  let app: INestApplication;
  let httpServer: Server;

  beforeAll(async () => {
    // Ensure schema is applied
    await runMigrations();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    httpServer = app.getHttpServer() as Server;
  });

  afterAll(async () => {
    if (app) await app.close();
    await closeDb();
  });

  const user = { email: 'items@example.com', password: 'Password123' };
  let token = '';
  let itemId = '';

  it('signup + login -> get /me', async () => {
    await request(httpServer).post('/api/auth/signup').send(user).expect(201);
    const loginRes = await request(httpServer).post('/api/auth/login').send(user).expect(201);
    expect(loginRes.body.token).toBeDefined();
    token = loginRes.body.token;

    const meRes = await request(httpServer).get('/api/users/me').set('Authorization', `Bearer ${token}`).expect(200);
    expect(meRes.body.email).toBe(user.email);
    expect(meRes.body.id).toBeDefined();
  });

  it('items CRUD + search (protected)', async () => {
    // Unauthorized list -> 401
    await request(httpServer).get('/api/items').expect(401);

    // Create item
    const createRes = await request(httpServer)
      .post('/api/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'My item', content: 'Hello world' })
      .expect(201);
    expect(createRes.body.id).toBeDefined();
    itemId = String(createRes.body.id);

    // List items
    const listRes = await request(httpServer).get('/api/items').set('Authorization', `Bearer ${token}`).expect(200);
    expect(Array.isArray(listRes.body)).toBeTruthy();
    expect(listRes.body.find((it: unknown) => String((it as Record<string, unknown>).id) === itemId)).toBeDefined();

    // Search items by q
    const searchRes = await request(httpServer).get('/api/items').query({ q: 'My' }).set('Authorization', `Bearer ${token}`).expect(200);
    expect(Array.isArray(searchRes.body)).toBeTruthy();
    expect(searchRes.body.length).toBeGreaterThanOrEqual(1);

    // Get by id
    const getRes = await request(httpServer).get(`/api/items/${itemId}`).set('Authorization', `Bearer ${token}`).expect(200);
    expect(getRes.body.title).toBe('My item');

    // Update item
    const updateRes = await request(httpServer)
      .patch(`/api/items/${itemId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated title' })
      .expect(200);
    expect(updateRes.body.title).toBe('Updated title');

    // Delete item
    await request(httpServer).delete(`/api/items/${itemId}`).set('Authorization', `Bearer ${token}`).expect(200);

    // Confirm deleted -> 404
    await request(httpServer).get(`/api/items/${itemId}`).set('Authorization', `Bearer ${token}`).expect(404);
  });
});
