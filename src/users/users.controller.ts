import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @UseGuards(AuthGuard)
  @Get('me')
  async me(@Req() req: any) {
    const id = req.user?.id;
    return this.users.findById(id);
  }
}
