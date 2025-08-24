import { IsOptional, IsString } from 'class-validator';
import { ItemBaseDto } from '../common/base.dto';

// CreateItemDto: reuse shared ItemBaseDto
export class CreateItemDto extends ItemBaseDto {}

// UpdateItemDto: partial update — mark fields optional
export class UpdateItemDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;
}
