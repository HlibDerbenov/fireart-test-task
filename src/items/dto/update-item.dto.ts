import { IsString, IsOptional, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateItemDto {
	@ApiPropertyOptional({ example: 'Updated title' })
	@IsOptional()
	@IsString()
	@MinLength(1)
	title?: string;

	@ApiPropertyOptional({ example: 'Updated content' })
	@IsOptional()
	@IsString()
	content?: string;
}
