import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { config } from '../config';

// Shared connection pool used by the app
export const pool = new Pool({
	connectionString: config.DATABASE_URL,
	max: Number(config.PG_MAX_CLIENTS),
	idleTimeoutMillis: Number(config.PG_IDLE_TIMEOUT_MS),
	connectionTimeoutMillis: Number(config.PG_CONN_TIMEOUT_MS),
});

// Initialize DB: run migrations and any other boot-time tasks
export async function initDb(): Promise<void> {
	await runMigrations();
}

// Simple SQL-file based migration runner
export async function runMigrations(): Promise<void> {
	const migrationsDir = path.resolve(__dirname, '../../migrations');
	// No migrations dir => nothing to do
	if (!fs.existsSync(migrationsDir)) {
		console.info('No migrations directory found, skipping migrations.');
		return;
	}

	const client = await pool.connect();
	try {
		// Ensure migrations table exists
		await client.query(`
			CREATE TABLE IF NOT EXISTS migrations (
				id SERIAL PRIMARY KEY,
				name TEXT NOT NULL UNIQUE,
				run_at TIMESTAMPTZ NOT NULL DEFAULT now()
			)
		`);

		const files = fs.readdirSync(migrationsDir)
			.filter((f) => f.endsWith('.sql'))
			.sort();

		for (const file of files) {
			const name = file;
			const already = await client.query('SELECT 1 FROM migrations WHERE name = $1', [name]);
			// Use safe check: already?.rowCount may be undefined/null in some typings — default to 0
			if ((already?.rowCount ?? 0) > 0) {
				continue; // already applied
			}

			const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
			console.info(`Applying migration: ${name}`);
			await client.query('BEGIN');
			try {
				// Execute the SQL (may contain multiple statements)
				await client.query(sql);
				await client.query('INSERT INTO migrations (name) VALUES ($1)', [name]);
				await client.query('COMMIT');
				console.info(`Migration applied: ${name}`);
			} catch (err) {
				await client.query('ROLLBACK');
				console.error(`Failed to apply migration ${name}`, err);
				throw err;
			}
		}

		// If running tests, ensure DB is clean: truncate data tables so tests start with empty state.
		if (process.env.NODE_ENV === 'test') {
			console.info('Test environment detected — truncating data tables for clean test runs.');
			// Truncate child tables first or use CASCADE. Restart identities to reset SERIALs.
			await client.query('BEGIN');
			try {
				await client.query('TRUNCATE TABLE password_reset_tokens, items, users RESTART IDENTITY CASCADE');
				await client.query('COMMIT');
				console.info('Test truncation complete.');
			} catch (err) {
				await client.query('ROLLBACK');
				console.error('Failed to truncate tables for test environment', err);
				throw err;
			}
		}
	} finally {
		client.release();
	}
}

export async function closeDb(): Promise<void> {
	await pool.end();
}