import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { pool } from '../db';

dotenv.config();

// Wait for DB readiness with retries
async function waitForDb(retries = 30, delayMs = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query('SELECT 1');
      // eslint-disable-next-line no-console
      console.log('Database is available');
      return;
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.log(`DB not ready yet (attempt ${i + 1}/${retries}): ${err.message || err}`);
      // wait
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error(`Database not ready after ${retries} attempts`);
}

export async function runMigrations() {
  await waitForDb(Number(process.env.MIGRATE_RETRIES || 30), Number(process.env.MIGRATE_SLEEP_MS || 1000));

  const migrationsDir = path.resolve(__dirname, '../../migrations');
  if (!fs.existsSync(migrationsDir)) {
    // eslint-disable-next-line no-console
    console.log('No migrations directory found.');
    return;
  }

  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
  if (files.length === 0) {
    // eslint-disable-next-line no-console
    console.log('No migration files found.');
    return;
  }

  const client = await pool.connect();
  try {
    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      // eslint-disable-next-line no-console
      console.log(`Running migration: ${file}`);
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
    }

    // If running under test environment, truncate data to ensure clean state for tests.
    if (process.env.NODE_ENV === 'test') {
      // Truncate in dependency-safe way; RESTART IDENTITY to reset serials.
      // Use CASCADE to ensure FK constraints do not block truncation.
      // eslint-disable-next-line no-console
      console.log('Test environment detected — truncating tables for clean test state.');
      await client.query('BEGIN');
      await client.query('TRUNCATE TABLE password_reset_tokens, items, users RESTART IDENTITY CASCADE');
      await client.query('COMMIT');
      // eslint-disable-next-line no-console
      console.log('Truncate complete.');
    }

    // eslint-disable-next-line no-console
    console.log('Migrations complete.');
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (_) {
      // ignore rollback errors
    }
    throw err;
  } finally {
    client.release();
  }
}

// If executed directly (npm run migrate using ts-node), run and exit on failure.
// If required/imported (e.g. tests), do NOT auto-run or call process.exit.
if (require.main === module) {
  runMigrations()
    .then(() => {
      // eslint-disable-next-line no-console
      console.log('Migrations applied successfully (direct run).');
      process.exit(0);
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
