import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

/**
 * Small library of base DTOs that are reused across feature DTOs.
 * Using classes allows class-validator to pick up decorators while keeping
 * definitions DRY and consistent.
 */

export class EmailDto {
  @IsEmail()
  email!: string;
}

export class PasswordDto {
  @IsString()
  @MinLength(8)
  password!: string;
}

// Common credentials container used by Signup and Login DTOs.
export class CredentialsDto extends EmailDto {
  @IsString()
  @MinLength(8)
  password!: string;
}

// Reused for reset password endpoint (only new password validation)
export class NewPasswordDto {
  @IsString()
  @MinLength(8)
  newPassword!: string;
}

// Base item shape reused by create/update DTOs
export class ItemBaseDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  content?: string;
}
