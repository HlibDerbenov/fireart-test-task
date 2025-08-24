import { Controller, Post, Body, UseGuards, Req, Get, Query, Param, Delete, Patch } from '@nestjs/common';
import { ItemsService } from './items.service';
import { AuthGuard } from '../auth/auth.guard';
import { CreateItemDto, UpdateItemDto } from './item.dto';

@UseGuards(AuthGuard)
@Controller('items')
export class ItemsController {
  constructor(private readonly items: ItemsService) {}

  @Post()
  async create(@Req() req: any, @Body() body: CreateItemDto) {
    return this.items.create(req.user.id, body);
  }

  @Get()
  async list(@Req() req: any, @Query('q') q?: string) {
    return this.items.search(req.user.id, q);
  }

  @Get(':id')
  async get(@Req() req: any, @Param('id') id: string) {
    return this.items.findOne(req.user.id, Number(id));
  }

  @Patch(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() body: UpdateItemDto) {
    return this.items.update(req.user.id, Number(id), body);
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    return this.items.remove(req.user.id, Number(id));
  }
}
