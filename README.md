# Fireart Test Task — Skeleton Challenge

This repository contains a NestJS-based backend implemented in TypeScript. The project demonstrates a manual authentication flow, owner-scoped CRUD for a sample "items" entity, PostgreSQL persistence, and automated tests and migrations.

Repository
- https://github.com/HlibDerbenov/fireart-test-task

Project purpose
- This project is an implementation of a skills evaluation task. Its primary purpose is to demonstrate code style, architecture choices, and design patterns (clear module separation, DTOs + validation, minimal manual auth, DI-friendly services, and testable code).

Status — requirements checklist
- Create a public GitHub repository: Add your repo URL above.
- README.md with useful information: Done (this file).
- TypeScript: Yes (strict TS config).
- Node.js + NestJS: Yes (Nest modules/controllers/services).
- PostgreSQL: Yes (pg client; docker-compose included).
- npm: Yes (package.json scripts).
- Postman collection: Included (postman_collection.json).
- Auth flow (signup/login/password reset token): Implemented (bcrypt + JWT; reset via token).
- Entity management (items) with CRUD + search: Implemented (owner-scoped, protected by JWT).
- No auth/ORM helper libraries used for core flows: Implemented (no @nestjs/passport, no TypeORM).
- Tests and CI: Integration tests included; CI workflow present.

Quick start (dockerized Postgres)
1. Copy `.env.example` -> `.env` and set values (DATABASE_URL or DB_*). Ensure JWT_SECRET is set.
2. Start services:
   - `docker-compose up --build -d`
3. Option A — let app run migrations automatically (entrypoint); Option B — run migrations manually:
   - `npm ci`
   - `npm run migrate`
4. Start app (if not running inside compose):
   - `npm run start:dev`
5. API base: `http://localhost:3000/api`

Quick start (local)
1. Copy `.env.example` -> `.env` and set `DATABASE_URL` to a reachable Postgres.
2. `npm ci`
3. `npm run migrate`
4. `npm run start:dev`
5. App is available at: `http://localhost:3000/api`

Run tests
- Integration tests use Jest + supertest and require a reachable Postgres.
- Locally:
  - `docker-compose up -d db`
  - `npm ci`
  - `npm run test`
- CI-style:
  - `npm run test:ci` (sets NODE_ENV=test, runs migrations, then tests)

Migrations
- SQL files are in `migrations/` (ordered). Run them via `npm run migrate`.
- The migration runner waits for DB readiness; when NODE_ENV=test it truncates tables to ensure clean test runs.

API summary (prefix `/api`)
Authentication
- POST /api/auth/signup
  - Body: { "email": "user@example.com", "password": "Password123" }
  - 201 created / 400 duplicate or validation error
- POST /api/auth/login
  - Body: { "email": "...", "password": "..." }
  - 201 { token } / 401 invalid credentials
- POST /api/auth/request-reset
  - Body: { "email": "..." }
  - 201 { ok: true } (token sent by EmailService; in tests stored in stub)
- POST /api/auth/reset
  - Body: { "token": "...", "newPassword": "..." }
  - 201 { ok: true } / 400 invalid/expired/used token

User
- GET /api/users/me
  - Protected: Authorization: Bearer <token>
  - 200 { id, email, created_at }

Entity — items (owner-scoped)
- POST /api/items (protected) — create
- GET /api/items (protected) — list, optional q query
- GET /api/items/:id (protected) — owner-only read
- PUT /api/items/:id (protected) — update (partial)
- DELETE /api/items/:id (protected) — delete

Recommended test sequence (happy path)
1. POST /api/auth/signup -> 201
2. POST /api/auth/login -> save token
3. GET /api/users/me -> 200
4. POST /api/items -> save itemId
5. GET /api/items -> 200
6. GET /api/items?q=... -> 200
7. GET /api/items/{itemId} -> 200
8. PUT /api/items/{itemId} -> 200
9. DELETE /api/items/{itemId} -> 200
10. POST /api/auth/request-reset -> capture token from logs/email stub
11. POST /api/auth/reset -> 201
12. Re-login with new password -> 201

Negative / edge cases to verify
- Duplicate signup -> 400
- Wrong login password -> 401
- Access protected endpoints without token -> 401
- Access another user's item -> 404
- Use expired/reset token -> 400
- Invalid DTOs (short password, bad email) -> 400

API documentation
- Swagger UI: http://localhost:3000/api/docs (or http://<host>:<PORT>/api/docs). Use the "Authorize" button and paste a Bearer token to try protected endpoints.

Postman collection
- A Postman collection is included in docs/postman_collection.json. Import it into Postman to run the provided positive & negative test cases.

Notes
- The app uses JWT Bearer auth; tokens are returned by POST /api/auth/login.
- Migrations: use `npm run migrate` or the app entrypoint (container) runs migrations on startup.

TODO / Improvements

Note: the project is intentionally concise to showcase coding style, architecture and design patterns. These recommended improvements move the code toward production readiness:
1. Email delivery: integrate a real email provider (SendGrid, SES) and remove reset-token exposure in API responses.
2. Migrations: replace the simple SQL runner with a proper migration tool (node-pg-migrate, Flyway) and manage migration versions in CI.
3. Deployment manifest: add production-ready Docker multi-stage build, health/readiness endpoints, and a deploy manifest for Render / Fly / AWS.
4. Secrets & config: integrate secrets management (Vault, Secrets Manager) and avoid .env in production.
5. Observability: structured logging, metrics endpoint, request tracing, and error reporting.
6. Security hardening: rate limiting, request throttling, strong JWT lifecycle (rotation/refresh), input sanitization, CSP, CORS tightening.
7. Tests: expand unit tests, add contract tests, and increase coverage thresholds. Add E2E tests to CI.
8. Static analysis: integrate linting rules, type-checking in CI, and optional security scanners (npm audit, Snyk).
9. Database: add connection pooling tuning, retry/backoff strategies, and optimize indexes and query plans for production loads.
10. Performance & schema: optional FK/migration improvements and data archival strategies.

Assumptions
- No third-party auth or ORM libraries should be used for core flows (this project adheres to that).
- Password reset tokens are returned/stored in test mode only for testability; replace with email sending in production.
- The app demonstrates modular NestJS structure and DI-friendly services rather than a complete production operational platform.

CI / Deployment notes
- `.github/workflows/ci.yml` runs migrations and tests against a Postgres service.
- For production, run migrations via CI or dedicated migration jobs before application startup.
- Provide DATABASE_URL and JWT_SECRET as environment secrets in your platform.

If you want
- I can add Postman pre-request scripts to auto-extract tokens,
- Provide a Newman command for CI,
- Add a Render/Fly deployment manifest.
CI & deployment notes
- `.github/workflows/ci.yml` runs migrations against a Postgres service and runs tests/build.
- For production:
  - Use a proper migration tool (node-pg-migrate / Flyway) and run migrations in CI or as an independent job.
  - Do not return reset tokens in API responses; send via email provider.
  - Store secrets (JWT_SECRET, DB creds) in a secrets manager; do not commit `.env`.
  - Add health & readiness endpoints, structured logs, monitoring and connection pooling tuned for production.

Testing hints
- Integration tests are in `test/` and use the same app configuration as `main.ts` (global prefix, ValidationPipe).
- To run tests reliably on CI/local:
  - Ensure DB reachable, run migrations (`npm run migrate`), then `npm run test`.
  - Use `npm run test:ci` for CI flow which sets NODE_ENV=test and runs migrations before tests.

If anything is unclear or you'd like:
- Postman scripts to auto-extract token/itemId,
- A Newman CLI command to run collection from CI,
- A deploy manifest for Render/Fly

Then tell me which and I will add it.
