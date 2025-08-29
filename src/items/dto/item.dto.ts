import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ItemResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 1 })
  owner_id!: number;

  @ApiProperty({ example: 'My item' })
  title!: string;

  @ApiPropertyOptional({ example: 'Hello world' })
  content?: string;

  @ApiProperty({ example: '2025-08-29T12:34:56.000Z', required: false })
  created_at?: string;
}
