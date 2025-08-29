import { ItemBaseDto } from '../common/base.dto';
import { PartialType } from '@nestjs/mapped-types';

// CreateItemDto: reuse shared ItemBaseDto
export class CreateItemDto extends ItemBaseDto {}

export class UpdateItemDto extends PartialType(ItemBaseDto) {}
