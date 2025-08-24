import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
dotenv.config();

// Prefer explicit DATABASE_URL; if not present, build it from DB_* variables.
// This ensures the app inside Docker can connect to the `db` service (host: "db") while
// still supporting local setups that provide DATABASE_URL directly.
const connectionString =
  process.env.DATABASE_URL ||
  (() => {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || '5432';
    const user = process.env.DB_USER || 'postgres';
    const password = process.env.DB_PASSWORD || 'postgres';
    const database = process.env.DB_NAME || 'testdb';
    return `postgres://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
  })();

if (!connectionString) {
  throw new Error('DATABASE_URL or DB_* environment variables are required');
}

// Pool configuration is configurable via env vars for production tuning.
// SSL can be enabled by setting DATABASE_SSL=true (useful for managed PG services).
export const pool = new Pool({
  connectionString,
  max: Number(process.env.PG_MAX_CLIENTS || 10),
  idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS || 30000),
  connectionTimeoutMillis: Number(process.env.PG_CONN_TIMEOUT_MS || 2000),
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

// Global error handler to avoid silent pool crashes
pool.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('Unexpected error on idle PG client', err);
});

// Lightweight query helper so other modules can use a single import
export async function query(text: string, params?: any[]) {
  return pool.query(text, params);
}

// Initialize DB connection. This no longer embeds schema SQL.
// If migrations are present, instruct to run them via the migration runner.
// For convenience we attempt a simple connection check here.
export async function initDb() {
  const client = await pool.connect();
  try {
    // simple check to ensure DB is reachable
    await client.query('SELECT 1');

    // If migrations directory exists and contains SQL files, we prefer migrations
    // as the single source of truth for schema. Do not create tables here.
    const migrationsDir = path.resolve(__dirname, '../migrations');
    if (fs.existsSync(migrationsDir)) {
      const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql'));
      if (files.length > 0) {
        // eslint-disable-next-line no-console
        console.log(
          'Migrations detected in migrations/*.sql. Run `npm run migrate` to apply schema changes. initDb will NOT create tables.',
        );
      } else {
        // eslint-disable-next-line no-console
        console.log('No migration files found in migrations/. If you expect the schema, add SQL files or run migrations.');
      }
    } else {
      // No migrations folder — helpful note for devs
      // eslint-disable-next-line no-console
      console.log('No migrations directory found. If you need automatic schema creation, add migrations or run SQL manually.');
    }
  } finally {
    client.release();
  }
}

// Close the pool for graceful shutdown (call from process handlers)
export async function closeDb() {
  await pool.end();
}
   