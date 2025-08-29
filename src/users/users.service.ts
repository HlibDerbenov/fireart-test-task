import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../db';

@Injectable()
export class UsersService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async findById(id: number) {
    const client = await this.pool.connect();
    try {
      const res = await client.query('SELECT id, email, created_at FROM users WHERE id = $1', [id]);
      if (!res.rows[0]) throw new NotFoundException('User not found');
      return res.rows[0];
    } finally {
      client.release();
    }
  }
}
