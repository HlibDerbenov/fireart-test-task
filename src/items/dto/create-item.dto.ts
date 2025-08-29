import { IsString, IsOptional, MinLength } from 'class-validator';

export class CreateItemDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsOptional()
  @IsString()
  content?: string;
}
