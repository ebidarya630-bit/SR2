import { getCloudflareContext } from "@opennextjs/cloudflare";

export interface D1Result<T = unknown> {
  results: T[];
  success: boolean;
  meta: { changes?: number; last_row_id?: number; [key: string]: unknown };
}
export interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  first<T = Record<string, unknown>>(colName?: string): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  run<T = unknown>(): Promise<D1Result<T>>;
}
export interface D1Database {
  prepare(query: string): D1Statement;
  batch<T = unknown>(statements: D1Statement[]): Promise<D1Result<T>[]>;
}

export function getDb(): D1Database {
  const { env } = getCloudflareContext();
  return (env as unknown as { DB: D1Database }).DB;
}

export async function first<T>(sql: string, ...values: unknown[]): Promise<T | null> {
  return getDb().prepare(sql).bind(...values).first<T>();
}
export async function all<T>(sql: string, ...values: unknown[]): Promise<T[]> {
  const result = await getDb().prepare(sql).bind(...values).all<T>();
  return result.results;
}
export async function run(sql: string, ...values: unknown[]) {
  return getDb().prepare(sql).bind(...values).run();
}
export async function batch(statements: Array<{ sql: string; values?: unknown[] }>) {
  const db = getDb();
  return db.batch(statements.map(({ sql, values = [] }) => db.prepare(sql).bind(...values)));
}
