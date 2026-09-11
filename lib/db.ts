import { Pool } from "pg";

const globalForDb = globalThis as unknown as { __pool?: Pool };

export const pool =
  globalForDb.__pool ??
  new Pool({
    host: process.env.SUPABASE_DB_HOST,
    port: Number(process.env.SUPABASE_DB_PORT ?? 5432),
    user: process.env.SUPABASE_DB_USER,
    password: process.env.SUPABASE_DB_PASSWORD,
    database: process.env.SUPABASE_DB_NAME,
    ssl:
      process.env.SUPABASE_DB_SSL === "true" || process.env.SUPABASE_DB_SSL === "1"
        ? { rejectUnauthorized: false }
        : false,
    max: 5,
  });

if (process.env.NODE_ENV !== "production") globalForDb.__pool = pool;

export async function query<T extends Record<string, unknown> = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const res = await pool.query(text, params);
  return res.rows as T[];
}