import { IsString, IsNotEmpty, IsBoolean, IsInt, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class AppConfig {
	@IsString()
	@IsNotEmpty()
	DATABASE_URL!: string;

	@Transform(({ value }) => {
		if (typeof value === 'boolean') return value;
		return String(value).toLowerCase() === 'true';
	})
	@IsBoolean()
	DATABASE_SSL!: boolean;

	@IsString()
	@IsNotEmpty()
	JWT_SECRET!: string;

	@Transform(({ value }) => Number.parseInt(String(value), 10))
	@IsInt()
	PORT!: number;

	@Transform(({ value }) => Number.parseInt(String(value), 10))
	@IsInt()
	RESET_TOKEN_EXPIRY_MINUTES!: number;

	@Transform(({ value }) => Number.parseInt(String(value), 10))
	@IsInt()
	SALT_ROUNDS!: number;

	@Transform(({ value }) => Number.parseInt(String(value), 10))
	@IsInt()
	PG_MAX_CLIENTS!: number;

	@Transform(({ value }) => Number.parseInt(String(value), 10))
	@IsInt()
	PG_IDLE_TIMEOUT_MS!: number;

	@Transform(({ value }) => Number.parseInt(String(value), 10))
	@IsInt()
	PG_CONN_TIMEOUT_MS!: number;

	// Optional DB parts
	@IsOptional()
	@IsString()
	DB_USER?: string;

	@IsOptional()
	@IsString()
	DB_PASSWORD?: string;

	@IsOptional()
	@IsString()
	DB_NAME?: string;

	@IsOptional()
	@Transform(({ value }) => (value == null ? undefined : Number.parseInt(String(value), 10)))
	@IsInt()
	DB_PORT?: number;
}
