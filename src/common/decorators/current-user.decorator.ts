import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthRequest, AuthUser } from '../types/auth-request';

export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext): AuthUser => {
  const req = ctx.switchToHttp().getRequest<AuthRequest>();
  if (!req.user) {
    throw new UnauthorizedException('User not authenticated');
  }
  return req.user;
});
