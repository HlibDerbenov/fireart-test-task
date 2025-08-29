import { Injectable, UnauthorizedException, BadRequestException, Inject } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { EmailService } from '../email/email.service';
import type { Secret, SignOptions } from 'jsonwebtoken';
import { User } from '../common/interfaces/user.interface';
import { Pool } from 'pg';
import { PG_POOL, withTransaction } from '../db';

@Injectable()
export class AuthService {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly emailService: EmailService,
  ) {}

  // Configurable via environment for better security in different environments
  private jwtSecret = process.env.JWT_SECRET || 'secret';
  private tokenExpiry = process.env.JWT_EXPIRES_IN || '1h';
  private resetTokenExpiryMinutes = Number(process.env.RESET_TOKEN_EXPIRY_MINUTES || 30);
  private bcryptSaltRounds = Number(process.env.SALT_ROUNDS || 12);

  // create JWT for user
  signToken(payload: { userId: number; email: string }) {
    const secret: Secret = this.jwtSecret as Secret;
    const options = { expiresIn: this.tokenExpiry } as unknown as SignOptions;
    return jwt.sign(payload, secret, options);
  }

  // verify incoming JWT
  verifyToken(token: string) {
    try {
      return jwt.verify(token, this.jwtSecret) as { userId: number; email: string; iat: number; exp: number };
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private validateCredentials(email: string, password: string) {
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      throw new BadRequestException('Invalid email');
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }
  }

  // Signup: create user with hashed password
  async signup(email: string, password: string): Promise<User> {
    this.validateCredentials(email, password);
    const client = await this.pool.connect();
    try {
      const hashed = await bcrypt.hash(password, this.bcryptSaltRounds);
      const res = await client.query(
        'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
        [email.toLowerCase().trim(), hashed],
      );
      return res.rows[0] as User;
    } catch (err: unknown) {
      const pgErr = err as { code?: string };
      if (pgErr.code === '23505') {
        throw new BadRequestException('Email already exists');
      }
      throw err;
    } finally {
      client.release();
    }
  }

  // Login: validate password and return JWT
  async login(email: string, password: string) {
    if (!email || !password) throw new BadRequestException('Email and password are required');
    const client = await this.pool.connect();
    try {
      const res = await client.query('SELECT id, email, password_hash FROM users WHERE email = $1', [email.toLowerCase().trim()]);
      const user = res.rows[0] as (User & { password_hash: string }) | undefined;
      if (!user) throw new UnauthorizedException('Invalid credentials');
      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) throw new UnauthorizedException('Invalid credentials');
      const token = this.signToken({ userId: user.id, email: user.email });
      return { token };
    } finally {
      client.release();
    }
  }

  // Request password reset: create token (store raw token) with expiry
  async requestPasswordReset(email: string) {
    if (!email || typeof email !== 'string') throw new BadRequestException('Email is required');
    const client = await this.pool.connect();
    try {
      const res = await client.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
      const user = res.rows[0];
      if (!user) {
        // Do not reveal user existence; return success for both cases
        return { ok: true };
      }
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + this.resetTokenExpiryMinutes * 60 * 1000);
      await client.query(
        'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
        [user.id, token, expiresAt],
      );

      // Use email provider stub. In test mode EmailService keeps the token for assertions.
      await this.emailService.sendPasswordReset(email.toLowerCase().trim(), token);

      return { ok: true };
    } finally {
      client.release();
    }
  }

  // Use token to reset password
  async resetPassword(token: string, newPassword: string) {
    if (!token || typeof token !== 'string') throw new BadRequestException('Token is required');
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      throw new BadRequestException('New password must be at least 8 characters');
    }

    return withTransaction(async (client) => {
      const res = await client.query(
        `SELECT prt.id as prt_id, prt.user_id, prt.expires_at, prt.used
         FROM password_reset_tokens prt
         WHERE prt.token = $1 FOR UPDATE`,
        [token],
      );
      const row = res.rows[0];
      if (!row) throw new BadRequestException('Invalid token');
      if (row.used) throw new BadRequestException('Token already used');
      if (new Date(row.expires_at) < new Date()) throw new BadRequestException('Token expired');

      const hashed = await bcrypt.hash(newPassword, this.bcryptSaltRounds);
      await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashed, row.user_id]);
      await client.query('UPDATE password_reset_tokens SET used = true WHERE id = $1', [row.prt_id]);
      return { ok: true };
    });
  }
}