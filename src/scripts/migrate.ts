import * as dotenv from 'dotenv';
dotenv.config();

import { pool, runMigrations as dbRunMigrations } from '../db';

export async function runMigrations() {
  const retries = 30;
  const delayMs = 1000;
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query('SELECT 1');
      // eslint-disable-next-line no-console
      console.log('Database is available');
      break;
    } catch (err: unknown) {
      const msg = (err instanceof Error) ? err.message : String(err);
      // eslint-disable-next-line no-console
      console.log(`DB not ready yet (attempt ${i + 1}/${retries}): ${msg}`);
      await new Promise((r) => setTimeout(r, delayMs));
      if (i === retries - 1) throw new Error('Database not ready after retries');
    }
  }

  await dbRunMigrations();
}

// CLI entry
export async function migrateCli() {
  await runMigrations();
}

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
