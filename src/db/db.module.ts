import { Module } from '@nestjs/common';
import { PgPoolProvider } from './index';

@Module({
	providers: [PgPoolProvider],
	exports: [PgPoolProvider],
})
export class DbModule {}
