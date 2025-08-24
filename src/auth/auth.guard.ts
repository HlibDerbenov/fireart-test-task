import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const authorization = req.headers['authorization'] || req.headers['Authorization'];
    if (!authorization) throw new UnauthorizedException('Missing authorization header');
    const parts = (authorization as string).split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') throw new UnauthorizedException('Invalid authorization header');
    const token = parts[1];
    const payload = this.auth.verifyToken(token);
    (req as any).user = { id: payload.userId, email: payload.email };
    return true;
  }
}
