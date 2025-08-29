import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ItemResponseDto } from './dto/item.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-request';

@ApiTags('items')
@ApiBearerAuth()
@Controller('items')
export class ItemsController {
  constructor(private readonly items: ItemsService) {}

  @ApiOperation({ summary: 'List items for the authenticated user (optional search q param)' })
  @ApiResponse({ status: 200, description: 'Array of items', type: ItemResponseDto, isArray: true })
  @Get()
  async list(@CurrentUser() user: AuthUser, @Query('q') q?: string) {
    return this.items.search(user.id, q);
  }

  @ApiOperation({ summary: 'Create a new item' })
  @ApiResponse({ status: 201, description: 'Item created', type: ItemResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post()
  async create(@CurrentUser() user: AuthUser, @Body() body: CreateItemDto) {
    return this.items.create(user.id, body);
  }

  @ApiOperation({ summary: 'Get item by id' })
  @ApiResponse({ status: 200, description: 'Item', type: ItemResponseDto })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id')
  async get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.items.findOne(user.id, Number(id));
  }

  @ApiOperation({ summary: 'Update item by id' })
  @ApiResponse({ status: 200, description: 'Updated item', type: ItemResponseDto })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch(':id')
  async update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: UpdateItemDto) {
    return this.items.update(user.id, Number(id), body);
  }

  @ApiOperation({ summary: 'Delete item by id' })
  @ApiResponse({ status: 200, description: 'Deleted' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete(':id')
  async delete(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.items.remove(user.id, Number(id));
  }
}
