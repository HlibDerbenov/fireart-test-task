import { Request } from 'express';

export type AuthUser = { id: number; email: string };

export type AuthRequest = Request & { user?: AuthUser };
