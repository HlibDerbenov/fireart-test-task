import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserResponseDto } from './dto/user.dto';
import { AuthRequest } from '../common/types/auth-request';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get current authenticated user ("me")' })
  @ApiResponse({ status: 200, description: 'User profile', type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('me')
  async me(@Req() req: AuthRequest) {
    const id = req.user?.id!;
    return this.users.findById(id);
  }
}
