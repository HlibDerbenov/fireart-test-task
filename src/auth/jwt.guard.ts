import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { config } from '../config';
import { IS_PUBLIC_KEY } from './public.decorator';

type JwtPayload = { userId: number | string; email: string | unknown; iat?: number; exp?: number };
type AuthRequest = Request & { user?: { id: number; email: string } };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const req = context.switchToHttp().getRequest<AuthRequest>();

    // Treat auth routes as public by default (signup/login/reset)
    const reqPath = (req.originalUrl || req.url || req.path || '').toString();
    const isAuthRoute = /(^|\/)auth(\/|$)/i.test(reqPath);

    if (isPublic || isAuthRoute) return true;

    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (!authHeader || typeof authHeader !== 'string') {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new UnauthorizedException('Invalid Authorization header format');
    }

    const token = parts[1];
    try {
      const payloadRaw = jwt.verify(token, config.JWT_SECRET);
      const payload = payloadRaw as JwtPayload;
      const id = typeof payload.userId === 'string' ? Number(payload.userId) : payload.userId;
      const email = String(payload.email);
      req.user = { id, email };
      return true;
    } catch (err) {
      // invalid or expired token -> 401
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
