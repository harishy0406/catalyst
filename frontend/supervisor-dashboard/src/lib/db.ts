import 'server-only';
import { Pool, type QueryResultRow } from 'pg';

/**
 * Direct connection to the same Supabase Postgres the FastAPI backend uses.
 * The dashboard never calls the backend API — it reads/writes the shared tables
 * defined in backend/app/database.py (SCHEMA_SQL).
 */

declare global {
  // Reuse the pool across Next.js dev hot reloads.
  var __catalystPool: Pool | undefined;
}

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not set (see .env.example)');
  return new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }, // Supabase pooler requires SSL
    max: 4, // the Supabase session pooler is shared with the backend
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
}

export const pool = globalThis.__catalystPool ?? (globalThis.__catalystPool = createPool());

export async function query<T extends QueryResultRow>(sql: string, params: unknown[] = []): Promise<T[]> {
  const res = await pool.query<T>(sql, params);
  return res.rows;
}
