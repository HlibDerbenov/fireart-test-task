import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('items')
@ApiBearerAuth()
@Controller('items')
export class ItemsController {
  constructor(private readonly items: ItemsService) {}

  @ApiOperation({ summary: 'List items for the authenticated user (optional search q param)' })
  @ApiResponse({ status: 200, description: 'Array of items' })
  @Get()
  async list(@Req() req: any, @Query('q') q?: string) {
    return this.items.search(req.user.id, q);
  }

  @ApiOperation({ summary: 'Create a new item' })
  @ApiResponse({ status: 201, description: 'Item created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post()
  async create(@Req() req: any, @Body() body: CreateItemDto) {
    return this.items.create(req.user.id, body);
  }

  @ApiOperation({ summary: 'Get item by id' })
  @ApiResponse({ status: 200, description: 'Item' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id')
  async get(@Req() req: any, @Param('id') id: string) {
    return this.items.findOne(req.user.id, Number(id));
  }

  @ApiOperation({ summary: 'Update item by id' })
  @ApiResponse({ status: 200, description: 'Updated item' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() body: UpdateItemDto) {
    return this.items.update(req.user.id, Number(id), body);
  }

  @ApiOperation({ summary: 'Delete item by id' })
  @ApiResponse({ status: 200, description: 'Deleted' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete(':id')
  async delete(@Req() req: any, @Param('id') id: string) {
    return this.items.remove(req.user.id, Number(id));
  }
}
