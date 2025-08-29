import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
	@ApiProperty({ example: 'the-reset-token-hex' })
	@IsString()
	token!: string;

	@ApiProperty({ minLength: 8, example: 'NewPass123' })
	@IsString()
	@MinLength(8)
	newPassword!: string;
}
