import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { AppConfig } from './config.dto';

function buildRawEnv() {
	return {
		DATABASE_URL: process.env.DATABASE_URL,
		DATABASE_SSL: process.env.DATABASE_SSL ?? 'false',
		JWT_SECRET: process.env.JWT_SECRET,
		PORT: process.env.PORT ?? '3000',
		RESET_TOKEN_EXPIRY_MINUTES: process.env.RESET_TOKEN_EXPIRY_MINUTES ?? '30',
		SALT_ROUNDS: process.env.SALT_ROUNDS ?? '12',
		PG_MAX_CLIENTS: process.env.PG_MAX_CLIENTS ?? '10',
		PG_IDLE_TIMEOUT_MS: process.env.PG_IDLE_TIMEOUT_MS ?? '30000',
		PG_CONN_TIMEOUT_MS: process.env.PG_CONN_TIMEOUT_MS ?? '2000',
		DB_USER: process.env.DB_USER,
		DB_PASSWORD: process.env.DB_PASSWORD,
		DB_NAME: process.env.DB_NAME,
		DB_PORT: process.env.DB_PORT,
	};
}

export function loadConfig() {
	const raw = buildRawEnv();
	const cfg = plainToInstance(AppConfig, raw, { enableImplicitConversion: true });
	const errors = validateSync(cfg, { skipMissingProperties: false });
	if (errors.length > 0) {
		/* Minimal logging for failing CI / startup */
		console.error('Configuration validation failed:', errors);
		throw new Error('Invalid configuration. See logs for details.');
	}
	return cfg as AppConfig;
}

export const config = loadConfig();