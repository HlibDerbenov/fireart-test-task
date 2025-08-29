import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL, withTransaction } from '../db';
import { CreateItemDto, UpdateItemDto } from './item.dto';

// Concrete Item type returned by service methods
type Item = {
  id: number;
  owner_id: number;
  title: string;
  content: string | null;
  created_at: string;
};

@Injectable()
export class ItemsService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async create(ownerId: number, dto: CreateItemDto): Promise<Item> {
    const client = await this.pool.connect();
    try {
      const res = await client.query(
        'INSERT INTO items (owner_id, title, content) VALUES ($1, $2, $3) RETURNING id, owner_id, title, content, created_at',
        [ownerId, dto.title, dto.content || null],
      );
      return res.rows[0] as Item;
    } finally {
      client.release();
    }
  }

  async findOne(ownerId: number, id: number): Promise<Item> {
    const client = await this.pool.connect();
    try {
      const res = await client.query('SELECT * FROM items WHERE id = $1 AND owner_id = $2', [id, ownerId]);
      const row = res.rows[0];
      if (!row) throw new NotFoundException('Item not found');
      return row as Item;
    } finally {
      client.release();
    }
  }

  async search(ownerId: number, q?: string): Promise<Item[]> {
    const client = await this.pool.connect();
    try {
      if (!q) {
        const res = await client.query('SELECT * FROM items WHERE owner_id = $1 ORDER BY created_at DESC', [ownerId]);
        return res.rows as Item[];
      }
      const res = await client.query(
        'SELECT * FROM items WHERE owner_id = $1 AND (title ILIKE $2 OR content ILIKE $2) ORDER BY created_at DESC',
        [ownerId, `%${q}%`],
      );
      return res.rows as Item[];
    } finally {
      client.release();
    }
  }

  async update(ownerId: number, id: number, dto: UpdateItemDto): Promise<Item> {
    return withTransaction(async (client) => {
      // Lock the row to avoid races
      const currentRes = await client.query('SELECT * FROM items WHERE id = $1 AND owner_id = $2 FOR UPDATE', [id, ownerId]);
      if (!currentRes.rows[0]) throw new NotFoundException('Item not found');
      const title = dto.title ?? currentRes.rows[0].title;
      const content = dto.content ?? currentRes.rows[0].content;
      const res = await client.query('UPDATE items SET title = $1, content = $2 WHERE id = $3 RETURNING *', [title, content, id]);
      return res.rows[0] as Item;
    });
  }

  async remove(ownerId: number, id: number): Promise<{ ok: boolean }> {
    const client = await this.pool.connect();
    try {
      const res = await client.query('DELETE FROM items WHERE id = $1 AND owner_id = $2 RETURNING *', [id, ownerId]);
      if (!res.rows[0]) throw new NotFoundException('Item not found');
      return { ok: true };
    } finally {
      client.release();
    }
  }
}
