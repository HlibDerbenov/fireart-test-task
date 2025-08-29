import * as dotenv from 'dotenv';
dotenv.config();

import { pool, runMigrations } from '../db/index';

// Wait for DB readiness with retries (reuses the shared pool)
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

export async function migrateCli() {
  await waitForDb(Number(process.env.MIGRATE_RETRIES ?? 30), Number(process.env.MIGRATE_SLEEP_MS ?? 1000));
  await runMigrations();
}

// If executed directly (npm run migrate using ts-node / node after build), run and exit with proper status.
if (require.main === module) {
  migrateCli()
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
