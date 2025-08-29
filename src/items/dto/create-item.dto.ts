import { IsString, IsOptional, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateItemDto {
	@ApiProperty({ example: 'My item' })
	@IsString()
	@MinLength(1)
	title!: string;

	@ApiPropertyOptional({ example: 'Hello world' })
	@IsOptional()
	@IsString()
	content?: string;
}
