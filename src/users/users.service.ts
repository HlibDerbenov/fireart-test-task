import { Injectable, NotFoundException } from '@nestjs/common';
import { pool } from '../db';

@Injectable()
export class UsersService {
  async findById(id: number) {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT id, email, created_at FROM users WHERE id = $1', [id]);
      if (!res.rows[0]) throw new NotFoundException('User not found');
      return res.rows[0];
    } finally {
      client.release();
    }
  }
}
